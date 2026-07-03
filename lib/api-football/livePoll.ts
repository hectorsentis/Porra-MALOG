import { prisma } from "@/lib/prisma";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { canMakeApiFootballCall, getApiFootballBudget, recordApiFootballCall } from "./budget";
import { fetchApiFootballFixturesByIds } from "./client";
import { applyFixtureResult } from "./applyFixtureResult";
import { ensureLiveMatchesActive } from "@/lib/live/ensure-active";
import { tryLinkLiveDraftMatches } from "./syncMatches";

export async function runApiFootballLivePoll(now = new Date()) {
  const activation = await ensureLiveMatchesActive(now);
  const newlyLinked = await tryLinkLiveDraftMatches();
  const active = await prisma.apiFootballSync.findMany({
    where: { isPollingActive: true },
    include: {
      match: {
        select: {
          matchId: true,
          matchNo: true,
          fase: true,
          jornadaId: true,
          homeTeamId: true,
          awayTeamId: true,
          homeGoals: true,
          awayGoals: true,
          homePens: true,
          awayPens: true,
          status: true
        }
      }
    }
  });

  if (active.length === 0) {
    return { skipped: true, reason: "no-active-matches", activation, newlyLinked, budget: await getApiFootballBudget(), polled: 0, updated: 0, finalized: 0 };
  }

  if (!(await canMakeApiFootballCall())) {
    return { skipped: true, reason: "rate-limit", activation, budget: await getApiFootballBudget(), polled: 0, updated: 0, finalized: 0 };
  }

  let api;
  try {
    api = await fetchApiFootballFixturesByIds(active.map((sync) => sync.apiMatchId));
  } catch (error) {
    await recordApiFootballCall({ endpoint: "/fixtures?ids", statusCode: null });
    await prisma.apiFootballSync.updateMany({
      where: { id: { in: active.map((row) => row.id) } },
      data: { errorCount: { increment: 1 }, lastError: error instanceof Error ? error.message : String(error), lastPolledAt: now }
    });
    throw error;
  }

  const fixtureByApiId = new Map(api.fixtures.map((fixture) => [fixture.apiMatchId, fixture]));
  let updated = 0;
  let finalized = 0;

  for (const sync of active) {
    const fixture = fixtureByApiId.get(sync.apiMatchId);
    if (!fixture) continue;

    const { changed, isFinished } = await applyFixtureResult(sync, fixture, now, "api-football");
    if (!changed) continue;

    // recalculateAll() only ever runs once a match goes OFFICIAL — it's the
    // authoritative/"emergency" recalculation, not something to run on every
    // goal. In-play score changes are already persisted to Match by
    // applyFixtureResult() above; "draft points" for those are computed on
    // the fly at read time (see lib/public/liveOverlay.ts) instead of being
    // written here.
    if (isFinished) {
      await recalculateAll(prisma, {
        trigger: "official-result",
        matchId: sync.matchId,
        createdBy: "api-football"
      });
      finalized += 1;
    }
    updated += 1;
  }

  return { skipped: false, activation, newlyLinked, budget: await getApiFootballBudget(), polled: active.length, updated, finalized };
}
