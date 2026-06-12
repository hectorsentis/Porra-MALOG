import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { PublicFilters } from "./filters";

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

export type HistoricalEvent = {
  id: string;
  label: string;
  createdAt: Date;
  phase: string | null;
  matchday: string | null;
  isLatest: boolean;
};

export type HistoricalRankingRow = {
  participantId: string;
  slug: string;
  alias: string;
  departamento: string | null;
  rango: string | null;
  pos: number;
  previousPos: number | null;
  deltaPos: number;
  pointsTotal: number;
  pointsGainedThisRun: number;
  pointsMatches: number;
  pointsGroups: number;
  pointsEliminatorias: number;
  pointsBonus: number;
};

export type HistoricalRanking = {
  events: HistoricalEvent[];
  selected: HistoricalEvent | null;
  rows: HistoricalRankingRow[];
};

export async function getHistoricalRanking(filters: PublicFilters = {}, snapshotId?: string): Promise<HistoricalRanking> {
  noStore();

  const events = await prisma.rankingSnapshot.findMany({
    where: { trigger: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true, phase: true, matchday: true, isLatest: true }
  });

  const selected = (snapshotId ? events.find((event) => event.id === snapshotId) : null) ?? events.find((event) => event.isLatest) ?? events[0] ?? null;

  if (!selected) {
    return { events, selected: null, rows: [] };
  }

  const snapshotRows = await prisma.rankingSnapshotRow.findMany({
    where: { snapshotId: selected.id },
    orderBy: { pos: "asc" },
    include: { participant: { select: { slug: true } } }
  });

  const rows: HistoricalRankingRow[] = snapshotRows
    .filter((row) => includes(row.alias, filters.alias) && includes(row.departamento, filters.departamento) && includes(row.rango, filters.rango))
    .map((row) => ({
      participantId: row.participantId,
      slug: row.participant?.slug ?? row.alias.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      alias: row.alias,
      departamento: row.departamento,
      rango: row.rango,
      pos: row.pos,
      previousPos: row.previousPos,
      deltaPos: row.deltaPos,
      pointsTotal: row.pointsTotal,
      pointsGainedThisRun: row.pointsGainedThisRun,
      pointsMatches: row.pointsMatches,
      pointsGroups: row.pointsGroups,
      pointsEliminatorias: row.pointsEliminatorias,
      pointsBonus: row.pointsBonus
    }));

  return { events, selected, rows };
}
