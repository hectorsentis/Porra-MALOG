import { describe, expect, it } from "vitest";
import { computeLiveProvisionalDeltas, type LiveBetInput, type LiveMatchState } from "@/lib/game/liveProvisional";
import { defaultRules } from "@/lib/game/rules";

// Predicted 2-1 (diff +1); actual 2-0 (diff +2) shares the sign but not the
// diff/exact score, so this exercises the "correct sign only" branch.
const groupMatch: LiveMatchState = {
  matchId: "M1",
  fase: "GRUPOS",
  homeTeamId: "ARG",
  awayTeamId: "BRA",
  homeGoals: 2,
  awayGoals: 0
};

const koMatch: LiveMatchState = {
  matchId: "M2",
  fase: "OCTAVOS",
  homeTeamId: "ARG",
  awayTeamId: "BRA",
  homeGoals: 1,
  awayGoals: 0
};

const bet: LiveBetInput = {
  betId: "B1",
  participantId: "P1",
  matchId: "M1",
  predHomeGoals: 2,
  predAwayGoals: 1
};

describe("computeLiveProvisionalDeltas", () => {
  it("returns no overlay when there are no live matches", () => {
    expect(computeLiveProvisionalDeltas([], [bet], defaultRules).size).toBe(0);
  });

  it("scores a correct-sign provisional result while the match is 2-0", () => {
    const deltas = computeLiveProvisionalDeltas([groupMatch], [bet], defaultRules);
    const delta = deltas.get("P1");

    expect(delta).toBeDefined();
    expect(delta!.signOk).toBe(true);
    expect(delta!.diffOk).toBe(false);
    expect(delta!.exactOk).toBe(false);
    expect(delta!.pointsDelta).toBe(defaultRules.correctSign);
  });

  it("updates the provisional score as the live match progresses to an exact match", () => {
    const updatedMatch: LiveMatchState = { ...groupMatch, homeGoals: 2, awayGoals: 1 };
    const deltas = computeLiveProvisionalDeltas([updatedMatch], [bet], defaultRules);
    const delta = deltas.get("P1")!;

    expect(delta.exactOk).toBe(true);
    expect(delta.pointsDelta).toBe(defaultRules.exactScore);
  });

  it("produces no overlay for knockout-phase live matches", () => {
    const koBet: LiveBetInput = { ...bet, matchId: "M2" };
    const deltas = computeLiveProvisionalDeltas([koMatch], [koBet], defaultRules);

    expect(deltas.size).toBe(0);
  });

  it("aggregates points across multiple live group matches for the same participant", () => {
    const secondMatch: LiveMatchState = { ...groupMatch, matchId: "M3", homeGoals: 2, awayGoals: 1 };
    const secondBet: LiveBetInput = { ...bet, betId: "B2", matchId: "M3" };
    const deltas = computeLiveProvisionalDeltas([groupMatch, secondMatch], [bet, secondBet], defaultRules);
    const delta = deltas.get("P1")!;

    expect(delta.pointsDelta).toBe(defaultRules.correctSign + defaultRules.exactScore);
    expect(delta.signOk).toBe(true);
    expect(delta.exactOk).toBe(true);
  });

  it("ignores bets for matches that aren't currently live", () => {
    const otherBet: LiveBetInput = { ...bet, matchId: "M-not-live" };
    const deltas = computeLiveProvisionalDeltas([groupMatch], [otherBet], defaultRules);

    expect(deltas.size).toBe(0);
  });
});
