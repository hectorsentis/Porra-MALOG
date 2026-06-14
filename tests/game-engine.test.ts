import { describe, expect, it } from "vitest";
import { calculateRanking } from "@/lib/game/ranking";
import { defaultRules } from "@/lib/game/rules";
import { scoreBonus } from "@/lib/game/scoreBonus";
import { scoreGroupBet } from "@/lib/game/scoreGroups";
import { scoreMatch } from "@/lib/game/scoreMatch";
import { simulateRanking } from "@/lib/game/simulator";
import { isOfficialMatchForScoring } from "@/lib/game/recalculateAll";
import { predictionSign, summarizePredictionDistribution } from "@/lib/public/matchStats";
import { computeGroupStandings } from "@/lib/game/groupStandings";

describe("scoreMatch", () => {
  it("scores exact result", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", predHomeGoals: 2, predAwayGoals: 1 },
      { matchId: "M1", homeGoals: 2, awayGoals: 1, finished: true }
    );

    expect(score.exactOk).toBe(true);
    expect(score.pointsResult).toBe(defaultRules.exactScore);
  });

  it("scores correct sign without exact score", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", predHomeGoals: 3, predAwayGoals: 1 },
      { matchId: "M1", homeGoals: 1, awayGoals: 0, finished: true }
    );

    expect(score.signOk).toBe(true);
    expect(score.diffOk).toBe(false);
    expect(score.pointsResult).toBe(defaultRules.correctSign);
  });

  it("scores correct goal difference", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", predHomeGoals: 3, predAwayGoals: 1 },
      { matchId: "M1", homeGoals: 2, awayGoals: 0, finished: true }
    );

    expect(score.diffOk).toBe(true);
    expect(score.pointsResult).toBe(defaultRules.correctGoalDiff);
  });

  it("scores zero for wrong result", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", predHomeGoals: 0, predAwayGoals: 1 },
      { matchId: "M1", homeGoals: 2, awayGoals: 0, finished: true }
    );

    expect(score.pointsTotal).toBe(0);
  });

  it("scores qualified team", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", fase: "R32", predHomeGoals: 9, predAwayGoals: 9, predQualifiedTeamId: "ARG" },
      { matchId: "M1", fase: "R32", homeGoals: 1, awayGoals: 1, qualifiedTeamId: "ARG", finished: true }
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.pointsQualified).toBe(defaultRules.koR32Qualified);
    expect(score.pointsResult).toBe(0);
  });

  it("scores exact KO crossing", () => {
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M1",
        fase: "R32",
        predHomeTeamId: "ESP",
        predAwayTeamId: "FRA",
        predHomeGoals: 2,
        predAwayGoals: 0
      },
      {
        matchId: "M1",
        fase: "R32",
        homeTeamId: "ESP",
        awayTeamId: "FRA",
        homeGoals: 1,
        awayGoals: 0,
        finished: true
      }
    );

    expect(score.cruceExactoOk).toBe(true);
    expect(score.spainMatch).toBe(true);
    expect(score.multiplier).toBe(2);
    expect(score.pointsCruceExacto).toBe(defaultRules.exactCrossing * 2);
  });

  it("scores exact KO crossing with reversed team order", () => {
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M1",
        fase: "R16",
        predHomeTeamId: "FRA",
        predAwayTeamId: "ESP"
      },
      {
        matchId: "M1",
        fase: "R16",
        homeTeamId: "ESP",
        awayTeamId: "FRA",
        homeGoals: 1,
        awayGoals: 0,
        finished: true
      }
    );

    expect(score.cruceExactoOk).toBe(true);
    expect(score.pointsCruceExacto).toBe(defaultRules.exactCrossing * 3);
  });

  it("does not score exact crossing for group-stage matches", () => {
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M1",
        fase: "GRUPOS",
        predHomeTeamId: "ESP",
        predAwayTeamId: "FRA",
        predHomeGoals: 2,
        predAwayGoals: 0
      },
      {
        matchId: "M1",
        fase: "GRUPOS",
        homeTeamId: "ESP",
        awayTeamId: "FRA",
        homeGoals: 2,
        awayGoals: 0,
        finished: true
      }
    );

    expect(score.cruceExactoOk).toBe(false);
    expect(score.pointsCruceExacto).toBe(0);
  });
});

describe("scoreGroups", () => {
  it("scores group qualified and exact position", () => {
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 1, predTeamId: "ESP" },
      [{ grupo: "A", teamId: "ESP", pos: 1, status: "Qualified" }]
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.exactPositionOk).toBe(true);
    expect(score.pointsTotal).toBe(defaultRules.groupQualified + defaultRules.groupExactPosition);
  });

  it("scores group qualified without exact position", () => {
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 2, predTeamId: "ESP" },
      [{ grupo: "A", teamId: "ESP", pos: 1 }]
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.exactPositionOk).toBe(false);
  });
});

describe("computeGroupStandings", () => {
  it("uses overall goal difference before head-to-head for tied teams", () => {
    const standings = computeGroupStandings(
      [
        { matchId: "M1", fase: "GRUPOS", grupo: "A", homeTeamId: "A1", awayTeamId: "A2", homeGoals: 0, awayGoals: 1, finished: true, status: "OFFICIAL" },
        { matchId: "M2", fase: "GRUPOS", grupo: "A", homeTeamId: "A1", awayTeamId: "A3", homeGoals: 4, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M3", fase: "GRUPOS", grupo: "A", homeTeamId: "A1", awayTeamId: "A4", homeGoals: 1, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M4", fase: "GRUPOS", grupo: "A", homeTeamId: "A2", awayTeamId: "A3", homeGoals: 1, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M5", fase: "GRUPOS", grupo: "A", homeTeamId: "A2", awayTeamId: "A4", homeGoals: 0, awayGoals: 2, finished: true, status: "OFFICIAL" },
        { matchId: "M6", fase: "GRUPOS", grupo: "A", homeTeamId: "A3", awayTeamId: "A4", homeGoals: 1, awayGoals: 1, finished: true, status: "OFFICIAL" }
      ],
      [
        { teamId: "A1", grupo: "A", tieBreakerRank: 1 },
        { teamId: "A2", grupo: "A", tieBreakerRank: 2 },
        { teamId: "A3", grupo: "A", tieBreakerRank: 3 },
        { teamId: "A4", grupo: "A", tieBreakerRank: 4 }
      ]
    );

    const groupA = standings.standings.filter((row) => row.grupo === "A");
    expect(groupA[0]).toMatchObject({ teamId: "A1", pts: 6, dg: 4 });
    expect(groupA[1]).toMatchObject({ teamId: "A2", pts: 6, dg: 0 });
  });
});

describe("scoreBonus", () => {
  const result = {
    campeon: "ESP",
    subcampeon: "ARG",
    semifinalistas: ["ESP", "ARG", "FRA", "BRA"],
    maximoGoleador: "Kane",
    seleccionMasGoleadora: "ESP",
    seleccionMasGoleada: "QAT",
    seleccionMenosGoleadora: "NZL",
    seleccionMenosGoleada: "ESP",
    equipoRevelacion: "JPN",
    equipoDecepcion: "ITA",
    totalGolesTorneo: 172
  };

  it("scores champion, runner-up and semifinalists", () => {
    const score = scoreBonus(
      {
        participantId: "P1",
        campeon: "ESP",
        subcampeon: "ARG",
        semifinalistas: ["ESP", "ARG", "URU", "FRA"]
      },
      result
    );

    expect(score.campeonOk).toBe(true);
    expect(score.subcampeonOk).toBe(true);
    expect(score.semifinalistasOk).toBe(3);
  });

  it("scores scorer and team market bonuses", () => {
    const score = scoreBonus(
      {
        participantId: "P1",
        maximoGoleador: "Kane",
        seleccionMasGoleadora: "ESP",
        seleccionMasGoleada: "QAT",
        seleccionMenosGoleadora: "NZL",
        seleccionMenosGoleada: "ESP",
        equipoRevelacion: "JPN",
        equipoDecepcion: "ITA"
      },
      result
    );

    expect(score.maximoGoleadorOk).toBe(true);
    expect(score.seleccionMasGoleadoraOk).toBe(true);
    expect(score.equipoDecepcionOk).toBe(true);
  });

  it("scores tied bonus markets when the bet is one of the tied selections", () => {
    const score = scoreBonus(
      {
        participantId: "P1",
        seleccionMasGoleadora: "BRA",
        equipoRevelacion: "MAR",
        maximoGoleador: "Mbappe"
      },
      {
        ...result,
        seleccionMasGoleadora: ["ESP", "BRA"],
        equipoRevelacion: ["JPN", "MAR"],
        maximoGoleador: ["Kane", "Mbappe"]
      }
    );

    expect(score.seleccionMasGoleadoraOk).toBe(true);
    expect(score.equipoRevelacionOk).toBe(true);
    expect(score.maximoGoleadorOk).toBe(true);
  });

  it("scores total goals within tolerance", () => {
    const score = scoreBonus({ participantId: "P1", totalGolesTorneo: 165 }, result);
    expect(score.totalGolesTorneoOk).toBe(true);
  });
});

describe("ranking", () => {
  it("sorts ranking with deterministic tie-breakers", () => {
    const ranking = calculateRanking([
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, pointsGroups: 0, pointsBonus: 5 },
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, pointsGroups: 0, pointsBonus: 5 },
      { participantId: "P3", alias: "Charlie", pointsMatches: 8, pointsGroups: 10, pointsBonus: 0 }
    ]);

    expect(ranking.map((row) => row.alias)).toEqual(["Charlie", "Alfa", "Bravo"]);
  });

  it("calculates Delta_Pos and Delta_Points", () => {
    const [row] = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 12, previousPos: 3, previousPoints: 8 }
    ]);

    expect(row.deltaPos).toBe(2);
    expect(row.deltaPoints).toBe(4);
  });
});

describe("simulator", () => {
  it("projects ranking without mutating official participant input", () => {
    const participants = [{ participantId: "P1", alias: "Alfa", pointsMatches: 1 }];
    const projected = simulateRanking({
      participants,
      matchScores: [
        {
          participantId: "P1",
          matchId: "M1",
          predSign: "1",
          predGoalDiff: 1,
          realSign: "1",
          realGoalDiff: 1,
          exactOk: false,
          diffOk: true,
          signOk: true,
          qualifiedOk: false,
          cruceExactoOk: false,
          spainMatch: false,
          multiplier: 1,
          pointsResult: 5,
          pointsQualified: 0,
          pointsCruceExacto: 0,
          pointsTotal: 5
        }
      ]
    });

    expect(projected[0].pointsMatches).toBe(6);
    expect(participants[0].pointsMatches).toBe(1);
  });
});

describe("official result publication", () => {
  it("does not allow draft results to move classification", () => {
    expect(
      isOfficialMatchForScoring({
        status: "PENDING",
        finished: true,
        homeGoals: 3,
        awayGoals: 0
      })
    ).toBe(false);
  });

  it("does not allow simulated results to move classification", () => {
    expect(
      isOfficialMatchForScoring({
        status: "SIMULATED",
        finished: true,
        homeGoals: 3,
        awayGoals: 0
      })
    ).toBe(false);
  });

  it("allows only official completed results to move classification", () => {
    expect(
      isOfficialMatchForScoring({
        status: "OFFICIAL",
        finished: true,
        homeGoals: 3,
        awayGoals: 0
      })
    ).toBe(true);
  });
});

describe("public match viewer stats", () => {
  it("calculates prediction signs for 1-X-2 distributions", () => {
    expect(predictionSign(2, 0)).toBe("1");
    expect(predictionSign(1, 1)).toBe("X");
    expect(predictionSign(0, 2)).toBe("2");
    expect(predictionSign(null, 2)).toBe("Pendiente");
  });

  it("summarizes most predicted result and distribution", () => {
    const summary = summarizePredictionDistribution([
      { predHomeGoals: 2, predAwayGoals: 1 },
      { predHomeGoals: 2, predAwayGoals: 1 },
      { predHomeGoals: 1, predAwayGoals: 1 },
      { predHomeGoals: null, predAwayGoals: null }
    ]);

    expect(summary.signs.one).toBe(2);
    expect(summary.signs.draw).toBe(1);
    expect(summary.signs.pending).toBe(1);
    expect(summary.mostPredictedResult).toBe("2-1");
    expect(summary.mostPredictedPct).toBe(50);
    expect(summary.averageGoals).toBe(2.67);
  });
});
