import type { Classification, Participant } from "@prisma/client";
import type { PublicClassificationRow } from "./dto";

export function toPublicClassificationRow(
  row: Classification & { participant?: Pick<Participant, "slug"> | null }
): PublicClassificationRow {
  return {
    slug: row.participant?.slug ?? row.alias.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    alias: row.alias,
    departamento: row.departamento,
    rango: row.rango,
    pos: row.pos,
    deltaPos: row.deltaPos,
    deltaPoints: row.deltaPoints,
    pointsTotal: row.pointsTotal,
    pointsMatches: row.pointsMatches,
    pointsGroups: row.pointsGroups,
    pointsEliminatorias: row.pointsEliminatorias,
    pointsBonus: row.pointsBonus
  };
}
