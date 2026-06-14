import { isOfficialMatchForScoring } from "./matchStatus";

const THIRD_PLACE_QUALIFIERS = 8;

export type GroupMatchInput = {
  matchId: string;
  fase?: string | null;
  grupo?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  status?: string | null;
  finished?: boolean | null;
};

export type GroupTeamInput = {
  teamId: string;
  grupo?: string | null;
  tieBreakerRank?: number | null;
  fifaRank?: number | null;
};

export type ComputedGroupStanding = {
  grupo: string;
  teamId: string;
  pos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  qualified: boolean;
};

export type GroupStandingsResult = {
  standings: ComputedGroupStanding[];
  completeGroups: Set<string>;
  groupStageComplete: boolean;
};

type TableRow = ComputedGroupStanding & { tieBreakerRank: number };

function isGroupStageMatch(match: GroupMatchInput): boolean {
  return (match.fase ?? "").toLocaleUpperCase("es-ES").includes("GRUPO") && Boolean(match.grupo);
}

function buildTable(grupo: string, teams: GroupTeamInput[], matches: GroupMatchInput[]): TableRow[] {
  const stats = new Map<string, { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number }>();
  for (const team of teams) stats.set(team.teamId, { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 });

  for (const match of matches) {
    const home = stats.get(match.homeTeamId ?? "");
    const away = stats.get(match.awayTeamId ?? "");
    if (!home || !away || match.homeGoals == null || match.awayGoals == null) continue;
    home.pj += 1;
    away.pj += 1;
    home.gf += match.homeGoals;
    home.gc += match.awayGoals;
    away.gf += match.awayGoals;
    away.gc += match.homeGoals;
    if (match.homeGoals > match.awayGoals) {
      home.pg += 1;
      away.pp += 1;
    } else if (match.homeGoals < match.awayGoals) {
      away.pg += 1;
      home.pp += 1;
    } else {
      home.pe += 1;
      away.pe += 1;
    }
  }

  return teams.map((team) => {
    const s = stats.get(team.teamId)!;
    return {
      grupo,
      teamId: team.teamId,
      pos: 0,
      pj: s.pj,
      pg: s.pg,
      pe: s.pe,
      pp: s.pp,
      gf: s.gf,
      gc: s.gc,
      dg: s.gf - s.gc,
      pts: s.pg * 3 + s.pe,
      qualified: false,
      tieBreakerRank: team.tieBreakerRank ?? Number.MAX_SAFE_INTEGER
    };
  });
}

function headToHeadTable(rows: TableRow[], matches: GroupMatchInput[]) {
  const ids = new Set(rows.map((row) => row.teamId));
  const h2h = new Map(rows.map((row) => [row.teamId, { pts: 0, gf: 0, gc: 0 }]));
  for (const match of matches) {
    const homeId = match.homeTeamId ?? "";
    const awayId = match.awayTeamId ?? "";
    if (!ids.has(homeId) || !ids.has(awayId) || homeId === awayId) continue;
    if (match.homeGoals == null || match.awayGoals == null) continue;
    const home = h2h.get(homeId)!;
    const away = h2h.get(awayId)!;
    home.gf += match.homeGoals;
    home.gc += match.awayGoals;
    away.gf += match.awayGoals;
    away.gc += match.homeGoals;
    if (match.homeGoals > match.awayGoals) home.pts += 3;
    else if (match.homeGoals < match.awayGoals) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }
  return h2h;
}

function sortGroupTable(rows: TableRow[], matches: GroupMatchInput[]): TableRow[] {
  const byPoints = [...rows].sort((a, b) => b.pts - a.pts);
  const result: TableRow[] = [];
  let i = 0;
  while (i < byPoints.length) {
    let j = i;
    while (j + 1 < byPoints.length && byPoints[j + 1].pts === byPoints[i].pts) j += 1;
    const tied = byPoints.slice(i, j + 1);
    if (tied.length === 1) {
      result.push(tied[0]);
    } else {
      const h2h = headToHeadTable(tied, matches);
      const broken = [...tied].sort((a, b) => {
        const h2hA = h2h.get(a.teamId)!;
        const h2hB = h2h.get(b.teamId)!;
        return (
          b.dg - a.dg ||
          b.gf - a.gf ||
          h2hB.pts - h2hA.pts ||
          h2hB.gf - h2hB.gc - (h2hA.gf - h2hA.gc) ||
          h2hB.gf - h2hA.gf ||
          a.tieBreakerRank - b.tieBreakerRank
        );
      });
      result.push(...broken);
    }
    i = j + 1;
  }
  return result;
}

function sortThirdPlaces(rows: TableRow[]): TableRow[] {
  return [...rows].sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.tieBreakerRank - b.tieBreakerRank
  );
}

export function computeGroupStandings(matches: GroupMatchInput[], teams: GroupTeamInput[]): GroupStandingsResult {
  const groupMatches = matches.filter(isGroupStageMatch);
  const matchesByGroup = new Map<string, GroupMatchInput[]>();
  for (const match of groupMatches) {
    const grupo = match.grupo!;
    const list = matchesByGroup.get(grupo) ?? [];
    list.push(match);
    matchesByGroup.set(grupo, list);
  }

  const teamsByGroup = new Map<string, GroupTeamInput[]>();
  for (const team of teams) {
    if (!team.grupo) continue;
    const list = teamsByGroup.get(team.grupo) ?? [];
    list.push(team);
    teamsByGroup.set(team.grupo, list);
  }

  const completeGroups = new Set<string>();
  const standingsByGroup = new Map<string, TableRow[]>();
  const thirdPlaceCandidates: TableRow[] = [];
  let groupsWithMatches = 0;

  for (const [grupo, groupTeams] of teamsByGroup) {
    const groupMatchList = matchesByGroup.get(grupo) ?? [];
    if (groupMatchList.length === 0) continue;
    groupsWithMatches += 1;
    if (!groupMatchList.every(isOfficialMatchForScoring)) continue;

    completeGroups.add(grupo);
    const table = buildTable(grupo, groupTeams, groupMatchList);
    const sorted = sortGroupTable(table, groupMatchList).map((row, index) => ({
      ...row,
      pos: index + 1,
      qualified: index < 2
    }));
    standingsByGroup.set(grupo, sorted);
    const third = sorted.find((row) => row.pos === 3);
    if (third) thirdPlaceCandidates.push(third);
  }

  const groupStageComplete = groupsWithMatches > 0 && completeGroups.size === groupsWithMatches;
  if (groupStageComplete && thirdPlaceCandidates.length > 0) {
    const ranked = sortThirdPlaces(thirdPlaceCandidates);
    const qualifiedKeys = new Set(ranked.slice(0, THIRD_PLACE_QUALIFIERS).map((row) => `${row.grupo}:${row.teamId}`));
    for (const rows of standingsByGroup.values()) {
      for (const row of rows) {
        if (row.pos === 3) row.qualified = qualifiedKeys.has(`${row.grupo}:${row.teamId}`);
      }
    }
  }

  const standings = [...standingsByGroup.values()].flat().map((row) => ({
    grupo: row.grupo,
    teamId: row.teamId,
    pos: row.pos,
    pj: row.pj,
    pg: row.pg,
    pe: row.pe,
    pp: row.pp,
    gf: row.gf,
    gc: row.gc,
    dg: row.dg,
    pts: row.pts,
    qualified: row.qualified
  }));

  return { standings, completeGroups, groupStageComplete };
}
