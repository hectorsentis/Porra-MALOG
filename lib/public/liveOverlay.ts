import { unstable_cache } from "next/cache";
import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveGameRules } from "@/lib/game/ruleConfig";
import { computeLiveProvisionalDeltas, type LiveProvisionalDelta } from "@/lib/game/liveProvisional";
import { LIVE_BETS_CACHE_REVALIDATE_SECONDS, LIVE_BETS_CACHE_TAG } from "./cache";

/** Fresh (uncached) — small, status-indexed query so live scores are never stale. */
async function getLiveGroupMatchesWithScores() {
  return prisma.match.findMany({
    where: { status: MatchStatus.DRAFT, homeGoals: { not: null }, awayGoals: { not: null } },
    select: { matchId: true, fase: true, homeTeamId: true, awayTeamId: true, homeGoals: true, awayGoals: true }
  });
}

/** Bet predictions don't change once a match starts, so this tolerates a longer revalidate window. */
const getCachedBetsForMatches = unstable_cache(
  async (matchIds: string[]) => {
    if (matchIds.length === 0) return [];
    return prisma.betMatch.findMany({
      where: { matchId: { in: matchIds } },
      select: {
        betId: true,
        participantId: true,
        matchId: true,
        fase: true,
        predHomeTeamId: true,
        predAwayTeamId: true,
        predHomeGoals: true,
        predAwayGoals: true
      }
    });
  },
  [LIVE_BETS_CACHE_TAG],
  { revalidate: LIVE_BETS_CACHE_REVALIDATE_SECONDS, tags: [LIVE_BETS_CACHE_TAG] }
);

/**
 * Computes the read-time "draft points" overlay for currently live group-phase
 * matches. Never written to the database — see `lib/game/liveProvisional.ts`.
 */
export async function getLiveProvisionalOverlay(): Promise<Map<string, LiveProvisionalDelta>> {
  const liveMatches = await getLiveGroupMatchesWithScores();
  if (liveMatches.length === 0) return new Map();

  const matchIds = [...liveMatches.map((match) => match.matchId)].sort();
  const bets = await getCachedBetsForMatches(matchIds);
  const rules = await getActiveGameRules();
  return computeLiveProvisionalDeltas(liveMatches, bets, rules);
}
