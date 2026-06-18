import type { RankingInput, RankingRow } from "./types";

function total(row: RankingInput): number {
  return (row.pointsMatches ?? 0) + (row.pointsGroups ?? 0) + (row.pointsEliminatorias ?? 0) + (row.pointsBonus ?? 0);
}

export function calculateRanking(rows: RankingInput[]): RankingRow[] {
  return [...rows]
    .sort((left, right) => {
      const totalDiff = total(right) - total(left);
      if (totalDiff !== 0) return totalDiff;
      const bonusDiff = (right.pointsBonus ?? 0) - (left.pointsBonus ?? 0);
      if (bonusDiff !== 0) return bonusDiff;
      const campeonDiff = (right.campeonOk ? 1 : 0) - (left.campeonOk ? 1 : 0);
      if (campeonDiff !== 0) return campeonDiff;
      const podiumDiff = ((right.subcampeonOk ? 1 : 0) + (right.semifinalistasOk ?? 0))
                       - ((left.subcampeonOk ? 1 : 0) + (left.semifinalistasOk ?? 0));
      if (podiumDiff !== 0) return podiumDiff;
      const koDiff = (right.pointsEliminatorias ?? 0) - (left.pointsEliminatorias ?? 0);
      if (koDiff !== 0) return koDiff;
      const exactDiff = (right.exactScores ?? 0) - (left.exactScores ?? 0);
      if (exactDiff !== 0) return exactDiff;
      const diffDiff = (right.correctDiffs ?? 0) - (left.correctDiffs ?? 0);
      if (diffDiff !== 0) return diffDiff;
      const signDiff = (right.correctSigns ?? 0) - (left.correctSigns ?? 0);
      if (signDiff !== 0) return signDiff;
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
