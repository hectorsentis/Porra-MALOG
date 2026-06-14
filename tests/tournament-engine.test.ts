import { describe, expect, it } from "vitest";
import { computeTournamentState } from "@/lib/game/tournamentEngine";

const teams = [
  { teamId: "A1", seleccion: "A1", grupo: "A", tieBreakerRank: 1, fifaRank: 1 },
  { teamId: "A2", seleccion: "A2", grupo: "A", tieBreakerRank: 2, fifaRank: 2 },
  { teamId: "A3", seleccion: "A3", grupo: "A", tieBreakerRank: 3, fifaRank: 3 },
  { teamId: "A4", seleccion: "A4", grupo: "A", tieBreakerRank: 4, fifaRank: 4 },
  { teamId: "B1", seleccion: "B1", grupo: "B", tieBreakerRank: 1, fifaRank: 1 },
  { teamId: "B2", seleccion: "B2", grupo: "B", tieBreakerRank: 2, fifaRank: 2 },
  { teamId: "B3", seleccion: "B3", grupo: "B", tieBreakerRank: 3, fifaRank: 3 },
  { teamId: "B4", seleccion: "B4", grupo: "B", tieBreakerRank: 4, fifaRank: 4 }
];

function groupMatch(matchId: string, grupo: string, homeTeamId: string, awayTeamId: string, homeGoals: number, awayGoals: number) {
  return {
    matchId,
    matchNo: Number(matchId.slice(1)),
    fase: "GRUPOS",
    grupo,
    homeSlot: null,
    awaySlot: null,
    homeTeamId,
    awayTeamId,
    homeTeam: homeTeamId,
    awayTeam: awayTeamId,
    homeGoals,
    awayGoals,
    homePens: null,
    awayPens: null,
    finished: true,
    winnerTeamId: homeGoals > awayGoals ? homeTeamId : awayGoals > homeGoals ? awayTeamId : null,
    qualifiedTeamId: null,
    overrideQualifiedTeamId: null,
    status: "OFFICIAL"
  };
}

describe("computeTournamentState", () => {
  it("calculates group standings with points, goals and status", () => {
    const state = computeTournamentState(
      [
        groupMatch("M001", "A", "A1", "A2", 2, 0),
        groupMatch("M002", "A", "A3", "A4", 1, 1),
        groupMatch("M003", "A", "A1", "A3", 1, 0),
        groupMatch("M004", "A", "A2", "A4", 2, 2),
        groupMatch("M005", "A", "A1", "A4", 3, 0),
        groupMatch("M006", "A", "A2", "A3", 2, 1)
      ],
      teams.filter((team) => team.grupo === "A"),
      []
    );

    const groupA = state.standings.filter((row) => row.grupo === "A");
    expect(groupA.map((row) => row.teamId)).toEqual(["A1", "A2", "A4", "A3"]);
    expect(groupA[0]).toMatchObject({ pts: 9, gf: 6, gc: 0, dg: 6, status: "CLASSIFIED" });
    expect(groupA[2]).toMatchObject({ teamId: "A4", status: "THIRD_CLASSIFIED" });
  });

  it("keeps third-place classification pending until every group is complete", () => {
    const state = computeTournamentState(
      [
        groupMatch("M001", "A", "A1", "A2", 2, 0),
        groupMatch("M002", "A", "A3", "A4", 1, 1),
        groupMatch("M003", "A", "A1", "A3", 1, 0),
        groupMatch("M004", "A", "A2", "A4", 2, 2),
        groupMatch("M005", "A", "A1", "A4", 3, 0),
        groupMatch("M006", "A", "A2", "A3", 2, 1)
      ],
      teams,
      []
    );

    expect(state.groupStageComplete).toBe(false);
    expect(state.thirdPlaces.find((row) => row.grupo === "A")?.qualified3rd).toBe(false);
  });

  it("uses overall goal difference before head-to-head for group ties", () => {
    const state = computeTournamentState(
      [
        groupMatch("M001", "A", "A1", "A2", 0, 1),
        groupMatch("M002", "A", "A1", "A3", 4, 0),
        groupMatch("M003", "A", "A1", "A4", 1, 0),
        groupMatch("M004", "A", "A2", "A3", 1, 0),
        groupMatch("M005", "A", "A2", "A4", 0, 2),
        groupMatch("M006", "A", "A3", "A4", 1, 1)
      ],
      teams.filter((team) => team.grupo === "A"),
      []
    );

    const groupA = state.standings.filter((row) => row.grupo === "A");
    expect(groupA[0]).toMatchObject({ teamId: "A1", pts: 6, dg: 4 });
    expect(groupA[1]).toMatchObject({ teamId: "A2", pts: 6, dg: 0 });
  });

  it("uses the official third-place mapping to resolve R32 candidate slots", () => {
    const matches = [
      groupMatch("M001", "A", "A1", "A2", 2, 0),
      groupMatch("M002", "A", "A3", "A4", 1, 1),
      groupMatch("M003", "A", "A1", "A3", 1, 0),
      groupMatch("M004", "A", "A2", "A4", 2, 2),
      groupMatch("M005", "A", "A1", "A4", 3, 0),
      groupMatch("M006", "A", "A2", "A3", 2, 1),
      groupMatch("M007", "B", "B1", "B2", 2, 0),
      groupMatch("M008", "B", "B3", "B4", 1, 1),
      groupMatch("M009", "B", "B1", "B3", 1, 0),
      groupMatch("M010", "B", "B2", "B4", 2, 2),
      groupMatch("M011", "B", "B1", "B4", 3, 0),
      groupMatch("M012", "B", "B2", "B3", 2, 1),
      {
        matchId: "M073",
        matchNo: 73,
        fase: "R32",
        grupo: null,
        homeSlot: "1A",
        awaySlot: "3AB",
        homeTeamId: null,
        awayTeamId: null,
        homeTeam: null,
        awayTeam: null,
        homeGoals: null,
        awayGoals: null,
        homePens: null,
        awayPens: null,
        finished: false,
        winnerTeamId: null,
        qualifiedTeamId: null,
        overrideQualifiedTeamId: null,
        status: "PENDING"
      }
    ];
    const state = computeTournamentState(matches, teams, [
      { qualifiedKey: "AB", opp1A: "3B", opp1B: "3A", opp1D: null, opp1E: null, opp1G: null, opp1I: null, opp1K: null, opp1L: null }
    ]);

    expect(state.groupStageComplete).toBe(true);
    expect(state.qualifiedKey).toBe("AB");
    expect(state.matchUpdates.find((row) => row.matchId === "M073")).toMatchObject({ homeTeamId: "A1", awayTeamId: "B4" });
  });
});
