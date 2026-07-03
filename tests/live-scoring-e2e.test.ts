/**
 * Fully mocked end-to-end dry run of the live-scoring path:
 *   fake cron trigger -> fake football-data.org response -> real runApiFootballLivePoll()
 *   -> real applyFixtureResult() -> real computeLiveProvisionalDeltas()
 *
 * Safety: `@/lib/prisma` is mocked with an in-memory fake — this test makes
 * ZERO real database connections and ZERO real HTTP calls (football-data.org's
 * client is mocked too). Nothing here touches the production DB, and nothing
 * here renders or touches any page/UI — it only exercises the library
 * functions used by app/api/cron/live-poll/route.ts.
 *
 * Run with: npx vitest run tests/live-scoring-e2e.test.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  matchState,
  syncState,
  fakeFixtureRef,
  matchUpdateMock,
  syncUpdateMock,
  matchResultEventCreateMock,
  syncFindManyMock,
  fetchFixturesMock,
  recalculateAllMock
} = vi.hoisted(() => {
  const matchState = {
    matchId: "M-LIVE-1",
    matchNo: 5,
    fase: "GRUPOS",
    jornadaId: "J1",
    homeTeamId: "ARG",
    awayTeamId: "BRA",
    homeGoals: null as number | null,
    awayGoals: null as number | null,
    homePens: null as number | null,
    awayPens: null as number | null,
    status: "DRAFT"
  };

  const syncState = {
    id: "sync-1",
    matchId: matchState.matchId,
    apiMatchId: 999001,
    isPollingActive: true,
    lastHomeGoals: null as number | null,
    lastAwayGoals: null as number | null,
    lastStatus: null as string | null
  };

  const fakeFixtureRef: { current: Record<string, unknown> | null } = { current: null };

  const matchUpdateMock = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    Object.assign(matchState, data);
    return { ...matchState };
  });
  const syncUpdateMock = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    Object.assign(syncState, data);
    return { ...syncState };
  });
  const matchResultEventCreateMock = vi.fn(async () => ({}));

  const syncFindManyMock = vi.fn(async () =>
    syncState.isPollingActive
      ? [
          {
            id: syncState.id,
            matchId: syncState.matchId,
            apiMatchId: syncState.apiMatchId,
            lastHomeGoals: syncState.lastHomeGoals,
            lastAwayGoals: syncState.lastAwayGoals,
            lastStatus: syncState.lastStatus,
            match: { ...matchState }
          }
        ]
      : []
  );

  // Stands in for the real football-data.org HTTP call.
  const fetchFixturesMock = vi.fn(async (ids: number[]) => ({
    endpoint: "/matches/fake",
    statusCode: 200,
    fixtures: fakeFixtureRef.current && ids.includes(fakeFixtureRef.current.apiMatchId as number) ? [fakeFixtureRef.current] : [],
    log: { url: "fake", params: {}, statusCode: 200, errors: null, results: 0, returned: [] }
  }));

  // Stands in for recalculateAll() — we only care WHETHER it's invoked, not
  // its internals (those are covered by the existing scoring engine tests).
  const recalculateAllMock = vi.fn(async (_prisma: unknown, _options: Record<string, unknown>) => ({
    runId: "fake-run",
    affectedParticipants: 0,
    ranking: []
  }));

  return { matchState, syncState, fakeFixtureRef, matchUpdateMock, syncUpdateMock, matchResultEventCreateMock, syncFindManyMock, fetchFixturesMock, recalculateAllMock };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiFootballSync: { findMany: syncFindManyMock, update: syncUpdateMock },
    match: { update: matchUpdateMock },
    matchResultEvent: { create: matchResultEventCreateMock },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        match: { update: matchUpdateMock },
        apiFootballSync: { update: syncUpdateMock },
        matchResultEvent: { create: matchResultEventCreateMock }
      })
  }
}));

vi.mock("@/lib/live/ensure-active", () => ({
  ensureLiveMatchesActive: vi.fn(async () => ({ skipped: true, activatedMatches: 0, activatedSyncs: 0, timedOut: 0 }))
}));

vi.mock("@/lib/api-football/syncMatches", () => ({
  tryLinkLiveDraftMatches: vi.fn(async () => [])
}));

vi.mock("@/lib/api-football/budget", () => ({
  canMakeApiFootballCall: vi.fn(async () => true),
  recordApiFootballCall: vi.fn(async () => undefined),
  getApiFootballBudget: vi.fn(async () => ({ source: "fake", rateLimit: 10, safetyBuffer: 2, usedLastMinute: 0, remaining: 8 }))
}));

vi.mock("@/lib/api-football/client", () => ({
  fetchApiFootballFixturesByIds: (ids: number[]) => fetchFixturesMock(ids)
}));

vi.mock("@/lib/game/recalculateAll", () => ({
  recalculateAll: (prisma: unknown, options: Record<string, unknown>) => recalculateAllMock(prisma, options)
}));

const { runApiFootballLivePoll } = await import("@/lib/api-football/livePoll");
const { computeLiveProvisionalDeltas } = await import("@/lib/game/liveProvisional");
const { defaultRules } = await import("@/lib/game/rules");

function resetState() {
  Object.assign(matchState, { homeGoals: null, awayGoals: null, homePens: null, awayPens: null, status: "DRAFT" });
  Object.assign(syncState, { isPollingActive: true, lastHomeGoals: null, lastAwayGoals: null, lastStatus: null });
  fakeFixtureRef.current = null;
  matchUpdateMock.mockClear();
  syncUpdateMock.mockClear();
  matchResultEventCreateMock.mockClear();
  recalculateAllMock.mockClear();
}

describe("live scoring end-to-end (fake cron + fake football-data.org response, mocked DB — no real writes)", () => {
  beforeEach(resetState);

  it("in-play goal: Match row updates, recalculateAll is NOT called, and draft points are computable on the fly", async () => {
    fakeFixtureRef.current = {
      apiMatchId: syncState.apiMatchId,
      date: new Date().toISOString(),
      status: "IN_PLAY",
      leagueId: 2000,
      leagueName: "FIFA World Cup 2026",
      season: 2026,
      homeName: "Argentina",
      awayName: "Brazil",
      homeGoals: 1,
      awayGoals: 0,
      homePens: null,
      awayPens: null,
      homeWinner: null,
      awayWinner: null
    };

    const result = await runApiFootballLivePoll(new Date());

    expect(result.skipped).toBe(false);
    expect(result.polled).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.finalized).toBe(0);

    // Only the Match row (+ sync bookkeeping) is written for a live update —
    // no scoring/ranking tables are touched, and recalculateAll never runs.
    expect(matchUpdateMock).toHaveBeenCalledTimes(1);
    expect(matchUpdateMock.mock.calls[0][0].data).toMatchObject({ homeGoals: 1, awayGoals: 0, status: "DRAFT", finished: false });
    expect(recalculateAllMock).not.toHaveBeenCalled();

    // "Draft points" for the live match, computed purely in memory (never persisted).
    const liveMatch = {
      matchId: matchState.matchId,
      fase: matchState.fase,
      homeTeamId: matchState.homeTeamId,
      awayTeamId: matchState.awayTeamId,
      homeGoals: matchState.homeGoals,
      awayGoals: matchState.awayGoals
    };
    const deltas = computeLiveProvisionalDeltas(
      [liveMatch],
      [
        { betId: "B1", participantId: "P1", matchId: matchState.matchId, predHomeGoals: 1, predAwayGoals: 0 }, // exact
        { betId: "B2", participantId: "P2", matchId: matchState.matchId, predHomeGoals: 2, predAwayGoals: 1 } // correct diff, not exact
      ],
      defaultRules
    );

    expect(deltas.get("P1")).toMatchObject({ exactOk: true, pointsDelta: defaultRules.exactScore });
    expect(deltas.get("P2")).toMatchObject({ exactOk: false, diffOk: true, pointsDelta: defaultRules.correctGoalDiff });
  });

  it("a poll with no score/status change writes nothing", async () => {
    Object.assign(matchState, { homeGoals: 1, awayGoals: 0 });
    Object.assign(syncState, { lastHomeGoals: 1, lastAwayGoals: 0, lastStatus: "IN_PLAY" });
    fakeFixtureRef.current = { apiMatchId: syncState.apiMatchId, status: "IN_PLAY", homeGoals: 1, awayGoals: 0, date: null, leagueId: null, leagueName: null, season: null, homeName: null, awayName: null, homePens: null, awayPens: null, homeWinner: null, awayWinner: null };

    const result = await runApiFootballLivePoll(new Date());

    expect(result.updated).toBe(0);
    expect(matchUpdateMock).not.toHaveBeenCalled();
    expect(recalculateAllMock).not.toHaveBeenCalled();
  });

  it("match finishes: recalculateAll runs exactly once with trigger official-result — the only write path for scoring", async () => {
    Object.assign(matchState, { homeGoals: 1, awayGoals: 0 });
    Object.assign(syncState, { lastHomeGoals: 1, lastAwayGoals: 0, lastStatus: "IN_PLAY" });
    fakeFixtureRef.current = {
      apiMatchId: syncState.apiMatchId,
      date: new Date().toISOString(),
      status: "FINISHED",
      leagueId: 2000,
      leagueName: "FIFA World Cup 2026",
      season: 2026,
      homeName: "Argentina",
      awayName: "Brazil",
      homeGoals: 2,
      awayGoals: 1,
      homePens: null,
      awayPens: null,
      homeWinner: true,
      awayWinner: false
    };

    const result = await runApiFootballLivePoll(new Date());

    expect(result.finalized).toBe(1);
    expect(matchUpdateMock.mock.calls[0][0].data).toMatchObject({ homeGoals: 2, awayGoals: 1, status: "OFFICIAL", finished: true });
    expect(recalculateAllMock).toHaveBeenCalledTimes(1);
    expect(recalculateAllMock.mock.calls[0][1]).toMatchObject({ trigger: "official-result", matchId: matchState.matchId });
  });
});
