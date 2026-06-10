import type { RankingInput, RankingRow } from "./types";

function total(row: RankingInput): number {
  return (row.pointsMatches ?? 0) + (row.pointsGroups ?? 0) + (row.pointsEliminatorias ?? 0) + (row.pointsBonus ?? 0);
}

export function calculateRanking(rows: RankingInput[]): RankingRow[] {
  return [...rows]
    .sort((left, right) => {
      const totalDiff = total(right) - total(left);
      if (totalDiff !== 0) return totalDiff;
      const matchDiff = (right.pointsMatches ?? 0) - (left.pointsMatches ?? 0);
      if (matchDiff !== 0) return matchDiff;
      const groupDiff = (right.pointsGroups ?? 0) - (left.pointsGroups ?? 0);
      if (groupDiff !== 0) return groupDiff;
      const bonusDiff = (right.pointsBonus ?? 0) - (left.pointsBonus ?? 0);
      if (bonusDiff !== 0) return bonusDiff;
      return left.alias.localeCompare(right.alias, "es");
    })
    .map((row, index) => {
      const pointsTotal = total(row);
      const pos = index + 1;
      return {
        participantId: row.participantId,
        alias: row.alias,
        departamento: row.departamento ?? null,
        rango: row.rango ?? null,
        pointsMatches: row.pointsMatches ?? 0,
        pointsGroups: row.pointsGroups ?? 0,
        pointsEliminatorias: row.pointsEliminatorias ?? 0,
        pointsBonus: row.pointsBonus ?? 0,
        pointsTotal,
        pos,
        deltaPos: row.previousPos == null ? 0 : row.previousPos - pos,
        deltaPoints: row.previousPoints == null ? pointsTotal : pointsTotal - row.previousPoints
      };
    });
}
