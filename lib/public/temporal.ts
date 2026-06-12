import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import type { PublicFilters } from "./filters";

const MS_DAY = 24 * 60 * 60 * 1000;

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}


function addDays(day: string, delta: number) {
  return isoDay(new Date(new Date(`${day}T00:00:00.000Z`).getTime() + delta * MS_DAY));
}

function isGroupPhase(fase: string | null | undefined) {
  const value = (fase ?? "").toLocaleLowerCase("es-ES");
  return value.includes("grupo") || value.includes("group");
}

async function availableOfficialDays() {
  const matches = await prisma.match.findMany({
    where: { status: "OFFICIAL", finished: true, fecha: { not: null } },
    select: { fecha: true },
    orderBy: { fecha: "asc" }
  });
  return [...new Set(matches.map((match) => match.fecha ? isoDay(match.fecha) : null).filter((value): value is string => Boolean(value)))];
}

export async function getTemporalFilterOptions() {
  noStore();
  const days = await availableOfficialDays();
  return { days, latestDay: days.at(-1) ?? null };
}

export type TemporalRankingRow = {
  pos: number;
  participantId: string;
  alias: string;
  slug: string;
  departamento: string | null;
  rango: string | null;
  pointsTotal: number;
  pointsMatches: number;
  pointsEliminatorias: number;
  exactScores: number;
  correctDiff: number;
  correctSigns: number;
  correctCruces: number;
  matchesCount: number;
};

export async function getTemporalClassification(filters: PublicFilters, mode: "daily" | "weekly") {
  noStore();
  const options = await getTemporalFilterOptions();
  const selectedDay = filters.fecha ?? options.latestDay;
  if (!selectedDay) return { selectedDay: null, startDay: null, endDay: null, rows: [] as TemporalRankingRow[], availableDays: options.days };

  const startDay = mode === "weekly" ? addDays(selectedDay, -6) : selectedDay;
  const endDay = selectedDay;
  const rows = await prisma.scoringMatch.findMany({
    where: {
      match: {
        status: "OFFICIAL",
        finished: true,
        fecha: { gte: new Date(`${startDay}T00:00:00.000Z`), lte: new Date(`${endDay}T23:59:59.999Z`) }
      }
    },
    select: {
      participantId: true,
      exactOk: true,
      diffOk: true,
      signOk: true,
      cruceExactoOk: true,
      pointsTotal: true,
      participant: { select: { alias: true, slug: true, departamento: true, rango: true } },
      match: { select: { fase: true } }
    }
  });

  const byParticipant = new Map<string, Omit<TemporalRankingRow, "pos">>();
  for (const score of rows) {
    const participant = score.participant;
    if (!includes(participant.alias, filters.alias) || !includes(participant.departamento, filters.departamento) || !includes(participant.rango, filters.rango)) continue;
    const current = byParticipant.get(score.participantId) ?? {
      participantId: score.participantId,
      alias: participant.alias,
      slug: participant.slug,
      departamento: participant.departamento,
      rango: participant.rango,
      pointsTotal: 0,
      pointsMatches: 0,
      pointsEliminatorias: 0,
      exactScores: 0,
      correctDiff: 0,
      correctSigns: 0,
      correctCruces: 0,
      matchesCount: 0
    };
    current.pointsTotal += score.pointsTotal;
    if (isGroupPhase(score.match.fase)) current.pointsMatches += score.pointsTotal;
    else current.pointsEliminatorias += score.pointsTotal;
    current.exactScores += score.exactOk ? 1 : 0;
    current.correctDiff += score.diffOk ? 1 : 0;
    current.correctSigns += score.signOk ? 1 : 0;
    current.correctCruces += score.cruceExactoOk ? 1 : 0;
    current.matchesCount += 1;
    byParticipant.set(score.participantId, current);
  }

  const ranked = [...byParticipant.values()]
    .sort((a, b) => b.pointsTotal - a.pointsTotal || b.exactScores - a.exactScores || b.correctCruces - a.correctCruces || a.alias.localeCompare(b.alias, "es-ES"))
    .map((row, index) => ({ ...row, pos: index + 1 }));

  return { selectedDay, startDay, endDay, rows: ranked, availableDays: options.days };
}

export type DailyEvolutionRow = {
  day: string;
  eventLabel: string;
  pointsTotal: number;
  exactScores: number;
  correctSigns: number;
  correctDiff: number;
  correctCruces: number;
  matchesCount: number;
  topAlias: string | null;
  topPoints: number;
};

export async function getDailyEvolution(filters: PublicFilters) {
  noStore();
  const rows = await prisma.scoringMatch.findMany({
    where: {
      match: {
        status: "OFFICIAL",
        finished: true,
        fecha: { not: null },
        ...(filters.fase ? { fase: { contains: filters.fase, mode: "insensitive" } } : {}),
        ...(filters.jornada ? { jornadaId: { contains: filters.jornada, mode: "insensitive" } } : {}),
        ...(filters.grupo ? { grupo: { contains: filters.grupo, mode: "insensitive" } } : {})
      }
    },
    select: {
      participantId: true,
      exactOk: true,
      diffOk: true,
      signOk: true,
      cruceExactoOk: true,
      pointsTotal: true,
      participant: { select: { alias: true, departamento: true, rango: true } },
      match: { select: { fecha: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true } }
    },
    orderBy: { match: { fecha: "asc" } }
  });

  const byDay = new Map<string, DailyEvolutionRow & { byParticipant: Map<string, number> }>();
  for (const score of rows) {
    if (!score.match.fecha) continue;
    if (!includes(score.participant.alias, filters.alias) || !includes(score.participant.departamento, filters.departamento) || !includes(score.participant.rango, filters.rango)) continue;
    if (filters.equipo) {
      const matchTeamHit = includes(score.match.homeTeam, filters.equipo) || includes(score.match.awayTeam, filters.equipo) || includes(score.match.homeTeamId, filters.equipo) || includes(score.match.awayTeamId, filters.equipo) || includes(formatCountry(score.match.homeTeamId, score.match.homeTeam), filters.equipo) || includes(formatCountry(score.match.awayTeamId, score.match.awayTeam), filters.equipo);
      if (!matchTeamHit) continue;
    }
    const day = isoDay(score.match.fecha);
    const current = byDay.get(day) ?? {
      day,
      eventLabel: day,
      pointsTotal: 0,
      exactScores: 0,
      correctSigns: 0,
      correctDiff: 0,
      correctCruces: 0,
      matchesCount: 0,
      topAlias: null,
      topPoints: 0,
      byParticipant: new Map<string, number>()
    };
    current.pointsTotal += score.pointsTotal;
    current.exactScores += score.exactOk ? 1 : 0;
    current.correctSigns += score.signOk ? 1 : 0;
    current.correctDiff += score.diffOk ? 1 : 0;
    current.correctCruces += score.cruceExactoOk ? 1 : 0;
    current.matchesCount += 1;
    const playerPoints = (current.byParticipant.get(score.participant.alias) ?? 0) + score.pointsTotal;
    current.byParticipant.set(score.participant.alias, playerPoints);
    if (playerPoints > current.topPoints) {
      current.topAlias = score.participant.alias;
      current.topPoints = playerPoints;
    }
    byDay.set(day, current);
  }

  return [...byDay.values()].map((row) => ({
    day: row.day,
    eventLabel: row.eventLabel,
    pointsTotal: row.pointsTotal,
    exactScores: row.exactScores,
    correctSigns: row.correctSigns,
    correctDiff: row.correctDiff,
    correctCruces: row.correctCruces,
    matchesCount: row.matchesCount,
    topAlias: row.topAlias,
    topPoints: row.topPoints
  })).sort((a, b) => a.day.localeCompare(b.day));
}

export type ParticipantEvolutionPoint = {
  day: string;
  [alias: string]: string | number;
};

export async function getParticipantPointsEvolution(filters: PublicFilters) {
  noStore();
  const rows = await prisma.scoringMatch.findMany({
    where: {
      match: {
        status: "OFFICIAL",
        finished: true,
        fecha: { not: null },
        ...(filters.fase ? { fase: { contains: filters.fase, mode: "insensitive" } } : {}),
        ...(filters.jornada ? { jornadaId: { contains: filters.jornada, mode: "insensitive" } } : {}),
        ...(filters.grupo ? { grupo: { contains: filters.grupo, mode: "insensitive" } } : {})
      }
    },
    select: {
      participantId: true,
      pointsTotal: true,
      participant: { select: { alias: true, departamento: true, rango: true } },
      match: { select: { fecha: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true } }
    },
    orderBy: { match: { fecha: "asc" } }
  });

  const byDayParticipant = new Map<string, Map<string, number>>();
  const aliasById = new Map<string, string>();
  for (const score of rows) {
    if (!score.match.fecha) continue;
    if (!includes(score.participant.alias, filters.alias) || !includes(score.participant.departamento, filters.departamento) || !includes(score.participant.rango, filters.rango)) continue;
    if (filters.equipo) {
      const matchTeamHit = includes(score.match.homeTeam, filters.equipo) || includes(score.match.awayTeam, filters.equipo) || includes(score.match.homeTeamId, filters.equipo) || includes(score.match.awayTeamId, filters.equipo) || includes(formatCountry(score.match.homeTeamId, score.match.homeTeam), filters.equipo) || includes(formatCountry(score.match.awayTeamId, score.match.awayTeam), filters.equipo);
      if (!matchTeamHit) continue;
    }
    const day = isoDay(score.match.fecha);
    aliasById.set(score.participantId, score.participant.alias);
    const dayMap = byDayParticipant.get(day) ?? new Map<string, number>();
    dayMap.set(score.participantId, (dayMap.get(score.participantId) ?? 0) + score.pointsTotal);
    byDayParticipant.set(day, dayMap);
  }

  const days = [...byDayParticipant.keys()].sort();
  const participantIds = [...aliasById.keys()];

  const cumulative = new Map<string, number>();
  const rows_: ParticipantEvolutionPoint[] = days.map((day) => {
    const dayMap = byDayParticipant.get(day)!;
    for (const participantId of participantIds) {
      const total = (cumulative.get(participantId) ?? 0) + (dayMap.get(participantId) ?? 0);
      cumulative.set(participantId, total);
    }
    const ranked = [...participantIds].sort((a, b) => {
      const totalDiff = (cumulative.get(b) ?? 0) - (cumulative.get(a) ?? 0);
      if (totalDiff !== 0) return totalDiff;
      return aliasById.get(a)!.localeCompare(aliasById.get(b)!, "es-ES");
    });
    const point: ParticipantEvolutionPoint = { day };
    ranked.forEach((participantId, index) => {
      point[aliasById.get(participantId)!] = index + 1;
    });
    return point;
  });

  const participants = participantIds
    .map((id) => ({ alias: aliasById.get(id)!, total: cumulative.get(id) ?? 0 }))
    .sort((a, b) => b.total - a.total || a.alias.localeCompare(b.alias, "es-ES"))
    .map((row) => row.alias);

  return { rows: rows_, participants };
}

