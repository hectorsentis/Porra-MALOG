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
    expect(score.pointsCruceExacto).toBe(defaultRules.exactCrossing * defaultRules.spainMultiplier);
  });

  it("scores exact KO crossing with reversed team order (Spain ×2)", () => {
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
    expect(score.pointsCruceExacto).toBe(defaultRules.exactCrossing * defaultRules.spainMultiplier);
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

  it("awards qualifiedOk via phase-wide qualifiers even when the bet's own match has not been played", () => {
    const phaseQualifiers = new Set(["CAN"]);
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M085",
        fase: "R32",
        predHomeTeamId: "CAN",
        predAwayTeamId: "ECU",
        predQualifiedTeamId: "CAN"
      },
      {
        matchId: "M085",
        fase: "R32",
        homeTeamId: null,
        awayTeamId: null,
        homeGoals: null,
        awayGoals: null,
        finished: false
      },
      defaultRules,
      phaseQualifiers
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.pointsQualified).toBe(defaultRules.koR32Qualified);
    expect(score.cruceExactoOk).toBe(false);
  });

  it("does not award qualifiedOk via phase-wide qualifiers when the predicted team did not qualify", () => {
    const phaseQualifiers = new Set(["CAN"]);
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M085",
        fase: "R32",
        predQualifiedTeamId: "ECU"
      },
      {
        matchId: "M085",
        fase: "R32",
        finished: false
      },
      defaultRules,
      phaseQualifiers
    );

    expect(score.qualifiedOk).toBe(false);
    expect(score.pointsQualified).toBe(0);
  });

  it("applies spainMultiplier to qualifiedOk points in KO Spain match", () => {
    const score = scoreMatch(
      { participantId: "P1", matchId: "M1", fase: "R32", predQualifiedTeamId: "ESP" },
      {
        matchId: "M1",
        fase: "R32",
        homeTeamId: "ESP",
        awayTeamId: "FRA",
        homeGoals: 1,
        awayGoals: 0,
        finished: true,
        qualifiedTeamId: "ESP"
      }
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.spainMatch).toBe(true);
    expect(score.pointsQualified).toBe(defaultRules.koR32Qualified * defaultRules.spainMultiplier);
  });

  it("applies spainMultiplier to cruceExacto + qualifiedOk when both score in KO Spain match", () => {
    const score = scoreMatch(
      {
        participantId: "P1",
        matchId: "M1",
        fase: "R32",
        predHomeTeamId: "ESP",
        predAwayTeamId: "FRA",
        predHomeGoals: 1,
        predAwayGoals: 0,
        predQualifiedTeamId: "ESP"
      },
      {
        matchId: "M1",
        fase: "R32",
        homeTeamId: "ESP",
        awayTeamId: "FRA",
        homeGoals: 1,
        awayGoals: 0,
        finished: true,
        qualifiedTeamId: "ESP"
      }
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.cruceExactoOk).toBe(true);
    expect(score.spainMatch).toBe(true);
    expect(score.pointsQualified).toBe(defaultRules.koR32Qualified * defaultRules.spainMultiplier);
    expect(score.pointsCruceExacto).toBe(defaultRules.exactCrossing * defaultRules.spainMultiplier);
    expect(score.pointsTotal).toBe(
      defaultRules.koR32Qualified * defaultRules.spainMultiplier +
      defaultRules.exactCrossing * defaultRules.spainMultiplier
    );
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

  it("does not award qualifiedOk when predicted pos 4 but team qualifies", () => {
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 4, predTeamId: "ZAF" },
      [{ grupo: "A", teamId: "ZAF", pos: 2, status: "clasificado" }]
    );

    expect(score.qualifiedOk).toBe(false);
    expect(score.exactPositionOk).toBe(false);
    expect(score.pointsTotal).toBe(0);
  });

  it("does not award qualifiedOk when predicted pos 3 without knockout bracket", () => {
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 3, predTeamId: "MEX" },
      [{ grupo: "A", teamId: "MEX", pos: 1, status: "clasificado" }]
    );

    expect(score.qualifiedOk).toBe(false);
    expect(score.pointsTotal).toBe(0);
  });

  it("awards qualifiedOk when predicted pos 3 and team is in knockout bracket", () => {
    const koTeams = new Set(["MEX"]);
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 3, predTeamId: "MEX" },
      [{ grupo: "A", teamId: "MEX", pos: 1, status: "clasificado" }],
      defaultRules,
      koTeams
    );

    expect(score.qualifiedOk).toBe(true);
    expect(score.exactPositionOk).toBe(false);
    expect(score.pointsTotal).toBe(defaultRules.groupQualified);
  });

  it("does not award qualifiedOk for pos 3 in bracket when team did not qualify", () => {
    const koTeams = new Set(["ARG"]);
    const score = scoreGroupBet(
      { participantId: "P1", grupo: "A", predPos: 3, predTeamId: "ARG" },
      [{ grupo: "A", teamId: "ARG", pos: 3, status: "out" }],
      defaultRules,
      koTeams
    );

    expect(score.qualifiedOk).toBe(false);
    expect(score.exactPositionOk).toBe(true);
    expect(score.pointsTotal).toBe(defaultRules.groupExactPosition);
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

  it("uses FIFA ranking before internal tieBreakerRank when all sporting criteria are tied", () => {
    const matches = [
      ["M1", "A1", "A2"],
      ["M2", "A1", "A3"],
      ["M3", "A1", "A4"],
      ["M4", "A2", "A3"],
      ["M5", "A2", "A4"],
      ["M6", "A3", "A4"]
    ].map(([matchId, homeTeamId, awayTeamId]) => ({
      matchId,
      fase: "GRUPOS",
      grupo: "A",
      homeTeamId,
      awayTeamId,
      homeGoals: 0,
      awayGoals: 0,
      finished: true,
      status: "OFFICIAL"
    }));

    const standings = computeGroupStandings(matches, [
      { teamId: "A1", grupo: "A", tieBreakerRank: 4, fifaRank: 40 },
      { teamId: "A2", grupo: "A", tieBreakerRank: 3, fifaRank: 10 },
      { teamId: "A3", grupo: "A", tieBreakerRank: 2, fifaRank: 30 },
      { teamId: "A4", grupo: "A", tieBreakerRank: 1, fifaRank: 20 }
    ]);

    expect(standings.standings.filter((row) => row.grupo === "A").map((row) => row.teamId)).toEqual(["A2", "A4", "A3", "A1"]);
  });

  it("reapplies FIFA tie-breakers inside a still-tied subgroup", () => {
    const standings = computeGroupStandings(
      [
        { matchId: "M1", fase: "GRUPOS", grupo: "A", homeTeamId: "A1", awayTeamId: "A2", homeGoals: 2, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M2", fase: "GRUPOS", grupo: "A", homeTeamId: "A2", awayTeamId: "A3", homeGoals: 1, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M3", fase: "GRUPOS", grupo: "A", homeTeamId: "A3", awayTeamId: "A1", homeGoals: 1, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M4", fase: "GRUPOS", grupo: "A", homeTeamId: "A1", awayTeamId: "A4", homeGoals: 4, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M5", fase: "GRUPOS", grupo: "A", homeTeamId: "A2", awayTeamId: "A4", homeGoals: 3, awayGoals: 0, finished: true, status: "OFFICIAL" },
        { matchId: "M6", fase: "GRUPOS", grupo: "A", homeTeamId: "A3", awayTeamId: "A4", homeGoals: 3, awayGoals: 1, finished: true, status: "OFFICIAL" }
      ],
      [
        { teamId: "A1", grupo: "A", tieBreakerRank: 1, fifaRank: 1 },
        { teamId: "A2", grupo: "A", tieBreakerRank: 2, fifaRank: 2 },
        { teamId: "A3", grupo: "A", tieBreakerRank: 3, fifaRank: 3 },
        { teamId: "A4", grupo: "A", tieBreakerRank: 4, fifaRank: 4 }
      ]
    );

    expect(standings.standings.filter((row) => row.grupo === "A").map((row) => row.teamId)).toEqual(["A1", "A2", "A3", "A4"]);
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

  it("breaks ties by bonus points before champion prediction", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, pointsBonus: 3 },
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, pointsBonus: 8 },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
  });

  it("breaks ties by champion prediction", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, pointsBonus: 5, campeonOk: false },
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, pointsBonus: 5, campeonOk: true },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
  });

  it("breaks ties by subcampeon + semifinalists", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, pointsBonus: 5, campeonOk: true, subcampeonOk: false, semifinalistasOk: 1 },
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, pointsBonus: 5, campeonOk: true, subcampeonOk: true, semifinalistasOk: 2 },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
  });

  it("breaks ties by eliminatorias points", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 2, pointsEliminatorias: 3, pointsBonus: 5 },
      { participantId: "P2", alias: "Bravo", pointsMatches: 0, pointsEliminatorias: 5, pointsBonus: 5 },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
  });

  it("breaks ties by exact scores in group stage", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, exactScores: 2 },
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, exactScores: 5 },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
  });

  it("breaks ties by correct diffs then signs", () => {
    const ranking = calculateRanking([
      { participantId: "P1", alias: "Alfa", pointsMatches: 10, correctDiffs: 3, correctSigns: 8 },
      { participantId: "P2", alias: "Bravo", pointsMatches: 10, correctDiffs: 5, correctSigns: 2 },
    ]);
    expect(ranking.map((row) => row.alias)).toEqual(["Bravo", "Alfa"]);
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
