import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { phaseGroupOf } from "@/lib/game/recalculateAll";
import type { PublicFilters } from "./filters";

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

export type HistoricalEvent = {
  id: string;
  kind: "match" | "phase-start";
  label: string;
  milestoneDate: Date;
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

  const [matchSnapshots, phaseMarkers, matches] = await Promise.all([
    prisma.rankingSnapshot.findMany({
      where: { trigger: null, matchId: { not: null } },
      select: { id: true, label: true, matchId: true, phase: true, matchday: true, isLatest: true, createdAt: true }
    }),
    prisma.rankingSnapshot.findMany({
      where: { trigger: "phase-start" },
      select: { id: true, phaseGroup: true }
    }),
    prisma.match.findMany({
      where: { fecha: { not: null } },
      select: { matchId: true, fecha: true, matchNo: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true, fase: true, jornadaId: true }
    })
  ]);

  const matchById = new Map(matches.map((match) => [match.matchId, match]));

  const latestSnapshotByMatchId = new Map<string, (typeof matchSnapshots)[number]>();
  for (const snapshot of matchSnapshots) {
    if (!snapshot.matchId) continue;
    const current = latestSnapshotByMatchId.get(snapshot.matchId);
    if (!current || snapshot.createdAt > current.createdAt) latestSnapshotByMatchId.set(snapshot.matchId, snapshot);
  }

  const matchEvents: HistoricalEvent[] = [...latestSnapshotByMatchId.values()]
    .map((snapshot): HistoricalEvent | null => {
      const match = snapshot.matchId ? matchById.get(snapshot.matchId) : undefined;
      if (!match?.fecha) return null;
      return {
        id: snapshot.id,
        kind: "match" as const,
        label: `${formatCountry(match.homeTeamId, match.homeTeam)} - ${formatCountry(match.awayTeamId, match.awayTeam)}`,
        milestoneDate: match.fecha,
        phase: snapshot.phase,
        matchday: snapshot.matchday,
        isLatest: snapshot.isLatest
      };
    })
    .filter((event): event is HistoricalEvent => event != null);

  const firstMatchDateByPhaseGroup = new Map<string, Date>();
  for (const match of matches) {
    if (!match.fecha) continue;
    const phaseGroup = phaseGroupOf(match.fase, match.jornadaId);
    if (!phaseGroup) continue;
    const current = firstMatchDateByPhaseGroup.get(phaseGroup);
    if (!current || match.fecha < current) firstMatchDateByPhaseGroup.set(phaseGroup, match.fecha);
  }

  const phaseEvents: HistoricalEvent[] = phaseMarkers
    .map((marker): HistoricalEvent | null => {
      const milestoneDate = marker.phaseGroup ? firstMatchDateByPhaseGroup.get(marker.phaseGroup) : undefined;
      if (!milestoneDate) return null;
      return {
        id: marker.id,
        kind: "phase-start" as const,
        label: `Inicio de fase ${marker.phaseGroup}`,
        milestoneDate,
        phase: null,
        matchday: null,
        isLatest: false
      };
    })
    .filter((event): event is HistoricalEvent => event != null);

  const events = [...matchEvents, ...phaseEvents].sort((a, b) => b.milestoneDate.getTime() - a.milestoneDate.getTime());

  const selected = (snapshotId ? events.find((event) => event.id === snapshotId) : null) ?? events.find((event) => event.kind === "match" && event.isLatest) ?? events[0] ?? null;

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
