export type FifaRankingRow = {
  teamId: string;
  pts: number;
  dg: number;
  gf: number;
  tieBreakerRank: number;
  fifaRank: number | null;
};

export type FifaRankingMatch = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
};

type HeadToHeadRow = {
  pts: number;
  gf: number;
  gc: number;
};

const MAX_RANK = Number.MAX_SAFE_INTEGER;

function compareByTeamId<T extends FifaRankingRow>(a: T, b: T) {
  return a.teamId.localeCompare(b.teamId, "es-ES");
}

function rankValue(row: FifaRankingRow) {
  return row.fifaRank ?? MAX_RANK;
}

function headToHeadTable<T extends FifaRankingRow, M extends FifaRankingMatch>(rows: T[], matches: M[]) {
  const ids = new Set(rows.map((row) => row.teamId));
  const table = new Map<string, HeadToHeadRow>(rows.map((row) => [row.teamId, { pts: 0, gf: 0, gc: 0 }]));

  for (const match of matches) {
    const homeId = match.homeTeamId ?? "";
    const awayId = match.awayTeamId ?? "";
    if (!ids.has(homeId) || !ids.has(awayId) || homeId === awayId) continue;
    if (match.homeGoals == null || match.awayGoals == null) continue;

    const home = table.get(homeId)!;
    const away = table.get(awayId)!;
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

  return table;
}

function splitByValue<T>(rows: T[], valueFor: (row: T) => number, descending: boolean) {
  const sorted = [...rows].sort((a, b) => {
    const diff = valueFor(a) - valueFor(b);
    return descending ? -diff : diff;
  });
  const groups: T[][] = [];

  for (const row of sorted) {
    const last = groups[groups.length - 1];
    if (!last || valueFor(last[0]) !== valueFor(row)) groups.push([row]);
    else last.push(row);
  }

  return groups;
}

function flattenResolvedGroups<T extends FifaRankingRow>(
  groups: T[][],
  nextCriterion: (rows: T[]) => T[]
) {
  return groups.flatMap((group) => (group.length === 1 ? group : nextCriterion(group)));
}

function breakTie<T extends FifaRankingRow, M extends FifaRankingMatch>(rows: T[], matches: M[], criterionIndex = 0): T[] {
  if (rows.length <= 1) return rows;

  switch (criterionIndex) {
    case 0:
      return flattenResolvedGroups(splitByValue(rows, (row) => row.dg, true), (group) => breakTie(group, matches, criterionIndex + 1));
    case 1:
      return flattenResolvedGroups(splitByValue(rows, (row) => row.gf, true), (group) => breakTie(group, matches, criterionIndex + 1));
    case 2: {
      const h2h = headToHeadTable(rows, matches);
      return flattenResolvedGroups(splitByValue(rows, (row) => h2h.get(row.teamId)!.pts, true), (group) =>
        breakTie(group, matches, criterionIndex + 1)
      );
    }
    case 3: {
      const h2h = headToHeadTable(rows, matches);
      return flattenResolvedGroups(splitByValue(rows, (row) => h2h.get(row.teamId)!.gf - h2h.get(row.teamId)!.gc, true), (group) =>
        breakTie(group, matches, criterionIndex + 1)
      );
    }
    case 4: {
      const h2h = headToHeadTable(rows, matches);
      return flattenResolvedGroups(splitByValue(rows, (row) => h2h.get(row.teamId)!.gf, true), (group) =>
        breakTie(group, matches, criterionIndex + 1)
      );
    }
    case 5:
      return flattenResolvedGroups(splitByValue(rows, rankValue, false), (group) => breakTie(group, matches, criterionIndex + 1));
    case 6:
      return flattenResolvedGroups(splitByValue(rows, (row) => row.tieBreakerRank, false), (group) =>
        breakTie(group, matches, criterionIndex + 1)
      );
    default:
      return [...rows].sort(compareByTeamId);
  }
}

export function sortFifaGroupRows<T extends FifaRankingRow, M extends FifaRankingMatch>(rows: T[], matches: M[]) {
  const pointGroups = splitByValue(rows, (row) => row.pts, true);
  return pointGroups.flatMap((group) => (group.length === 1 ? group : breakTie(group, matches)));
}

export function sortFifaThirdPlaceRows<T extends FifaRankingRow>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      rankValue(a) - rankValue(b) ||
      a.tieBreakerRank - b.tieBreakerRank ||
      compareByTeamId(a, b)
  );
}
