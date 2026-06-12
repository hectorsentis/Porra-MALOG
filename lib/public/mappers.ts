import type { PublicClassificationRow } from "./dto";

type PublicRankingShape = {
  alias: string;
  departamento: string | null;
  rango: string | null;
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
  participant?: { slug: string } | null;
};

export function toPublicClassificationRow(row: PublicRankingShape): PublicClassificationRow {
  return {
    slug: row.participant?.slug ?? row.alias.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    alias: row.alias,
    departamento: row.departamento,
    rango: row.rango,
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
