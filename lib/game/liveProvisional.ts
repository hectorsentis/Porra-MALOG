import { isGroupPhase, scoreMatch } from "./scoreMatch";
import type { GameRules } from "./rules";

/**
 * Computes "draft points" for in-play matches purely in memory — never
 * writes to the database. `recalculateAll()` remains the only writer of
 * `scoringMatch`/`generalRanking`, and only runs once a match goes OFFICIAL.
 * This lets the public read paths show live provisional points without any
 * additional DB write per goal.
 *
 * Scoped to group-phase matches: knockout `qualifiedOk`/`cruceExactoOk`
 * depend on cross-match phase qualifiers, which isn't a cheap single-match
 * computation, so knockout live matches simply get no overlay (they already
 * show no provisional points today, since those flags require `finished`).
 */

export type LiveMatchState = {
  matchId: string;
  fase: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type LiveBetInput = {
  betId?: string | null;
  participantId: string;
  matchId: string;
  fase?: string | null;
  predHomeTeamId?: string | null;
  predAwayTeamId?: string | null;
  predHomeGoals?: number | null;
  predAwayGoals?: number | null;
};

export type LiveProvisionalDelta = {
  pointsDelta: number;
  exactOk: boolean;
  diffOk: boolean;
  signOk: boolean;
};

export function computeLiveProvisionalDeltas(
  liveMatches: LiveMatchState[],
  bets: LiveBetInput[],
  rules: GameRules
): Map<string, LiveProvisionalDelta> {
  const deltas = new Map<string, LiveProvisionalDelta>();

  const groupMatchById = new Map(
    liveMatches
      .filter((match) => isGroupPhase(match.fase) && match.homeGoals != null && match.awayGoals != null)
      .map((match) => [match.matchId, match])
  );
  if (groupMatchById.size === 0) return deltas;

  for (const bet of bets) {
    const match = groupMatchById.get(bet.matchId);
    if (!match) continue;

    const score = scoreMatch(
      {
        betId: bet.betId,
        participantId: bet.participantId,
        matchId: bet.matchId,
        fase: bet.fase ?? match.fase,
        predHomeTeamId: bet.predHomeTeamId,
        predAwayTeamId: bet.predAwayTeamId,
        predHomeGoals: bet.predHomeGoals,
        predAwayGoals: bet.predAwayGoals
      },
      {
        matchId: match.matchId,
        fase: match.fase,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        finished: true
      },
      rules
    );

    const current = deltas.get(bet.participantId) ?? { pointsDelta: 0, exactOk: false, diffOk: false, signOk: false };
    deltas.set(bet.participantId, {
      pointsDelta: current.pointsDelta + score.pointsTotal,
      exactOk: current.exactOk || score.exactOk,
      diffOk: current.diffOk || score.diffOk,
      signOk: current.signOk || score.signOk
    });
  }

  return deltas;
}
