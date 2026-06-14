import type { PublicClassificationRow } from "./dto";

type PublicRankingShape = {
  pos: number;
  deltaPos: number;
  deltaPoints: number;
  deltaPosPhase?: number | null;
  deltaPosDay?: number | null;
  pointsTotal: number;
  pointsMatches: number;
  pointsGroups: number;
  pointsEliminatorias: number;
  pointsBonus: number;
  participant: { slug: string; alias: string; departamento: string | null; rango: string | null };
};

export function toPublicClassificationRow(row: PublicRankingShape): PublicClassificationRow {
  return {
    slug: row.participant.slug,
    alias: row.participant.alias,
    departamento: row.participant.departamento,
    rango: row.participant.rango,
    pos: row.pos,
    deltaPos: row.deltaPos,
    deltaPoints: row.deltaPoints,
    deltaPosPhase: row.deltaPosPhase ?? null,
    deltaPosDay: row.deltaPosDay ?? null,
    pointsTotal: row.pointsTotal,
    pointsMatches: row.pointsMatches,
    pointsGroups: row.pointsGroups,
    pointsEliminatorias: row.pointsEliminatorias,
    pointsBonus: row.pointsBonus
  };
}
