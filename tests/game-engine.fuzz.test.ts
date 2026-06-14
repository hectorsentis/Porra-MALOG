import { describe, expect, it } from "vitest";
import { calculateRanking } from "@/lib/game/ranking";
import { defaultRules, spainTeamIds } from "@/lib/game/rules";
import { scoreBonus } from "@/lib/game/scoreBonus";
import { scoreGroupBet } from "@/lib/game/scoreGroups";
import { getGoalDiff, getSign, scoreMatch } from "@/lib/game/scoreMatch";

/**
 * Deterministic PRNG (mulberry32) so fuzz runs are reproducible across machines/CI.
 */
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260610);
const randInt = (max: number) => Math.floor(rand() * (max + 1));
const TEAMS = ["ESP", "FRA", "ARG", "BRA", "GER", "POR", "ITA", "ENG", "NED", "MAR", "JPN", "URU"];
const pickTeam = () => TEAMS[randInt(TEAMS.length - 1)];

const ITERATIONS = 500;

describe("scoreMatch random results", () => {
  it(`holds scoring invariants across ${ITERATIONS} random matches/predictions`, () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const predHomeGoals = randInt(6);
      const predAwayGoals = randInt(6);
      const homeGoals = randInt(6);
      const awayGoals = randInt(6);
      const homeTeamId = pickTeam();
      const awayTeamId = pickTeam();
      const predHomeTeamId = rand() < 0.5 ? homeTeamId : pickTeam();
      const predAwayTeamId = rand() < 0.5 ? awayTeamId : pickTeam();
      const qualifiedTeamId = rand() < 0.5 ? homeTeamId : awayTeamId;
      const predQualifiedTeamId = rand() < 0.5 ? qualifiedTeamId : pickTeam();

      const bet = {
        participantId: "P1",
        matchId: `M${i}`,
        fase: "GRUPOS",
        predHomeGoals,
        predAwayGoals,
        predHomeTeamId,
        predAwayTeamId,
        predQualifiedTeamId
      };
      const result = {
        matchId: `M${i}`,
        fase: "GRUPOS",
        homeGoals,
        awayGoals,
        homeTeamId,
        awayTeamId,
        qualifiedTeamId,
        finished: true
      };

      const score = scoreMatch(bet, result);

      // predSign/realSign/predGoalDiff must match the exported helpers
      expect(score.predSign).toBe(getSign(predHomeGoals, predAwayGoals));
      expect(score.realSign).toBe(getSign(homeGoals, awayGoals));
      expect(score.predGoalDiff).toBe(getGoalDiff(predHomeGoals, predAwayGoals));
      expect(score.realGoalDiff).toBe(getGoalDiff(homeGoals, awayGoals));

      // pointsTotal is always the sum of its parts, never negative
      expect(score.pointsTotal).toBe(score.pointsResult + score.pointsQualified + score.pointsCruceExacto);
      expect(score.pointsResult).toBeGreaterThanOrEqual(0);
      expect(score.pointsQualified).toBeGreaterThanOrEqual(0);
      expect(score.pointsCruceExacto).toBeGreaterThanOrEqual(0);

      // an exact scoreline implies the goal difference and sign are also correct
      if (score.exactOk) {
        expect(score.diffOk).toBe(true);
        expect(score.signOk).toBe(true);
      }
      // a correct goal difference implies a correct sign
      if (score.diffOk) {
        expect(score.signOk).toBe(true);
      }

      // multiplier reflects the Spain rule and only scales the result points
      const isSpainMatch = spainTeamIds.has(homeTeamId) || spainTeamIds.has(awayTeamId);
      expect(score.spainMatch).toBe(isSpainMatch);
      expect(score.multiplier).toBe(isSpainMatch ? defaultRules.spainMultiplier : 1);
      const baseResultPoints = score.exactOk
        ? defaultRules.exactScore
        : score.diffOk
          ? defaultRules.correctGoalDiff
          : score.signOk
            ? defaultRules.correctSign
            : 0;
      expect(score.pointsResult).toBe(baseResultPoints * score.multiplier);

      // group matches never award the eliminatory qualified-team bonus
      expect(score.qualifiedOk).toBe(false);
      expect(score.pointsQualified).toBe(0);

      // group matches never award exact-crossing points
      expect(score.cruceExactoOk).toBe(false);
      expect(score.pointsCruceExacto).toBe(0);
    }
  });

  it("never awards points for an unfinished match", () => {
    for (let i = 0; i < 50; i++) {
      const score = scoreMatch(
        {
          participantId: "P1",
          matchId: `M${i}`,
          predHomeGoals: randInt(5),
          predAwayGoals: randInt(5),
          predQualifiedTeamId: pickTeam()
        },
        { matchId: `M${i}`, homeGoals: randInt(5), awayGoals: randInt(5), qualifiedTeamId: pickTeam(), finished: false }
      );
      expect(score.pointsTotal).toBe(0);
      expect(score.exactOk).toBe(false);
      expect(score.diffOk).toBe(false);
      expect(score.signOk).toBe(false);
      expect(score.qualifiedOk).toBe(false);
    }
  });
});

describe("scoreGroupBet random standings", () => {
  const groupTeams = ["A1", "A2", "A3", "A4"];

  it(`holds scoring invariants across ${ITERATIONS} random group standings`, () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const predPos = randInt(3) + 1;
      const predTeamId = rand() < 0.9 ? groupTeams[randInt(groupTeams.length - 1)] : null;
      const shuffled = [...groupTeams].sort(() => rand() - 0.5);
      const standings = shuffled.map((teamId, index) => ({ grupo: "A", teamId, pos: index + 1 }));

      const score = scoreGroupBet({ participantId: "P1", grupo: "A", predPos, predTeamId }, standings);

      expect(score.pointsTotal).toBe(score.pointsQualified + score.pointsPosition);
      expect(score.pointsQualified).toBeGreaterThanOrEqual(0);
      expect(score.pointsPosition).toBeGreaterThanOrEqual(0);

      if (!predTeamId) {
        expect(score.qualifiedOk).toBe(false);
        expect(score.exactPositionOk).toBe(false);
        expect(score.pointsTotal).toBe(0);
        continue;
      }

      const standing = standings.find((item) => item.teamId === predTeamId)!;
      expect(score.realPos).toBe(standing.pos);
      expect(score.exactPositionOk).toBe(standing.pos === predPos);
      // default qualification rule: top-2 of the group qualify
      expect(score.qualifiedOk).toBe(standing.pos <= 2);
      if (score.exactPositionOk && predPos <= 2) {
        expect(score.qualifiedOk).toBe(true);
      }
    }
  });
});

describe("scoreBonus random picks", () => {
  const pool = ["ESP", "FRA", "ARG", "BRA", "GER", "POR", "ITA", "ENG", "NED", "MAR", "JPN", "URU", "CRO", "BEL"];
  const pick = () => pool[randInt(pool.length - 1)];
  const pickMany = (n: number) => Array.from({ length: n }, pick);

  it(`holds scoring invariants across ${ITERATIONS} random bonus combinations`, () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const result = {
        campeon: pick(),
        subcampeon: pick(),
        semifinalistas: pickMany(4),
        maximoGoleador: pick(),
        seleccionMasGoleadora: pick(),
        seleccionMasGoleada: pick(),
        seleccionMenosGoleadora: pick(),
        seleccionMenosGoleada: pick(),
        equipoRevelacion: pick(),
        equipoDecepcion: pick(),
        totalGolesTorneo: 100 + randInt(80)
      };
      const bet = {
        participantId: "P1",
        campeon: pick(),
        subcampeon: pick(),
        semifinalistas: pickMany(4),
        maximoGoleador: pick(),
        seleccionMasGoleadora: pick(),
        seleccionMasGoleada: pick(),
        seleccionMenosGoleadora: pick(),
        seleccionMenosGoleada: pick(),
        equipoRevelacion: pick(),
        equipoDecepcion: pick(),
        totalGolesTorneo: 100 + randInt(80)
      };

      const score = scoreBonus(bet, result);

      expect(score.semifinalistasOk).toBeGreaterThanOrEqual(0);
      expect(score.semifinalistasOk).toBeLessThanOrEqual(4);

      const expectedTotal =
        (score.campeonOk ? defaultRules.champion : 0) +
        (score.subcampeonOk ? defaultRules.runnerUp : 0) +
        score.semifinalistasOk * defaultRules.semifinalist +
        (score.maximoGoleadorOk ? defaultRules.topScorer : 0) +
        (score.seleccionMasGoleadoraOk ? defaultRules.teamMostGoalsFor : 0) +
        (score.seleccionMasGoleadaOk ? defaultRules.teamMostGoalsAgainst : 0) +
        (score.seleccionMenosGoleadoraOk ? defaultRules.teamLeastGoalsFor : 0) +
        (score.seleccionMenosGoleadaOk ? defaultRules.teamLeastGoalsAgainst : 0) +
        (score.equipoRevelacionOk ? defaultRules.revelation : 0) +
        (score.equipoDecepcionOk ? defaultRules.disappointment : 0) +
        (score.totalGolesTorneoOk ? defaultRules.totalGoals : 0);
      expect(score.pointsTotal).toBe(expectedTotal);
      expect(score.pointsTotal).toBeGreaterThanOrEqual(0);

      expect(score.totalGolesTorneoOk).toBe(Math.abs(bet.totalGolesTorneo - result.totalGolesTorneo) <= defaultRules.totalGoalsTolerance);
    }
  });
});

describe("calculateRanking random rosters", () => {
  it("produces a gapless, descending, order-stable ranking for 100 random rosters", () => {
    for (let i = 0; i < 100; i++) {
      const size = 5 + randInt(15);
      const participants = Array.from({ length: size }, (_, idx) => ({
        participantId: `P${idx}`,
        alias: `Jugador ${idx}`,
        pointsMatches: randInt(50),
        pointsGroups: randInt(20),
        pointsEliminatorias: randInt(20),
        pointsBonus: randInt(30),
        previousPos: idx + 1,
        previousPoints: randInt(100)
      }));

      const ranking = calculateRanking(participants);

      // positions form a contiguous 1..N sequence
      expect(ranking.map((row) => row.pos)).toEqual(Array.from({ length: size }, (_, idx) => idx + 1));

      // pointsTotal equals the sum of its components, and rows are sorted descending
      for (let j = 0; j < ranking.length; j++) {
        const row = ranking[j];
        expect(row.pointsTotal).toBe(row.pointsMatches + row.pointsGroups + row.pointsEliminatorias + row.pointsBonus);
        if (j > 0) expect(ranking[j - 1].pointsTotal).toBeGreaterThanOrEqual(row.pointsTotal);
      }

      // re-running on a shuffled copy of the same input yields the same order (deterministic tie-breakers)
      const shuffled = [...participants].sort(() => rand() - 0.5);
      const ranking2 = calculateRanking(shuffled);
      expect(ranking2.map((row) => row.participantId)).toEqual(ranking.map((row) => row.participantId));
    }
  });
});

describe("end-to-end random tournament", () => {
  it("aggregates random match scores into a consistent overall ranking", () => {
    const participantCount = 8;
    const matchCount = 20;
    const participants = Array.from({ length: participantCount }, (_, idx) => ({ participantId: `P${idx}`, alias: `Jugador ${idx}` }));
    const totals = new Map(participants.map((participant) => [participant.participantId, 0]));

    for (let m = 0; m < matchCount; m++) {
      const homeTeamId = pickTeam();
      const awayTeamId = pickTeam();
      const homeGoals = randInt(5);
      const awayGoals = randInt(5);
      for (const participant of participants) {
        const score = scoreMatch(
          {
            participantId: participant.participantId,
            matchId: `M${m}`,
            predHomeGoals: randInt(5),
            predAwayGoals: randInt(5)
          },
          { matchId: `M${m}`, homeGoals, awayGoals, homeTeamId, awayTeamId, finished: true }
        );
        totals.set(participant.participantId, (totals.get(participant.participantId) ?? 0) + score.pointsTotal);
      }
    }

    const ranking = calculateRanking(participants.map((participant) => ({ ...participant, pointsMatches: totals.get(participant.participantId) ?? 0 })));

    expect(ranking.map((row) => row.pos)).toEqual(Array.from({ length: participantCount }, (_, idx) => idx + 1));
    for (const row of ranking) {
      expect(row.pointsTotal).toBe(totals.get(row.participantId));
      expect(row.pointsTotal).toBeGreaterThanOrEqual(0);
    }
    const leader = ranking[0];
    for (const row of ranking) expect(leader.pointsTotal).toBeGreaterThanOrEqual(row.pointsTotal);
  });
});
