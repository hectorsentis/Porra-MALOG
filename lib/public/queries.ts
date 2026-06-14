import { unstable_noStore as noStore } from "next/cache";
import { MatchStatus } from "@prisma/client";
import { formatCountry } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import type { PublicDashboardData, PublicParticipantProfile } from "./dto";
import type { PublicFilters } from "./filters";
import { toPublicClassificationRow } from "./mappers";

const emptyDashboard: PublicDashboardData = {
  leader: null,
  distanceToSecond: null,
  participantsCount: 0,
  distributedPoints: 0,
  computedMatches: 0,
  lastUpdatedAt: null,
  nextMatch: null,
  ranking: [],
  departmentAverages: [],
  composition: [
    { name: "Partidos", value: 0 },
    { name: "Grupos", value: 0 },
    { name: "Eliminatorias", value: 0 },
    { name: "Bonus", value: 0 }
  ]
};

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

function madridDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function madridStartOfToday() {
  return new Date(`${madridDateKey()}T00:00:00.000Z`);
}

export async function getPublicDashboard(filters: PublicFilters = {}): Promise<PublicDashboardData> {
  noStore();
  try {
    const [classification, participantsCount, computedMatches, nextMatch] = await Promise.all([
      prisma.generalRanking.findMany({
        orderBy: { pos: "asc" },
        include: { participant: { select: { slug: true, alias: true, departamento: true, rango: true } } },
        take: 50
      }),
      prisma.participant.count(),
      prisma.match.count({ where: { status: "OFFICIAL", finished: true } }),
      prisma.match.findFirst({
        where: {
          fecha: { not: null, gte: madridStartOfToday() },
          status: { notIn: [MatchStatus.OFFICIAL, MatchStatus.VOID] }
        },
        orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
        select: {
          matchId: true,
          fecha: true,
          hora: true,
          homeTeamId: true,
          awayTeamId: true,
          homeTeam: true,
          awayTeam: true,
          homeSlot: true,
          awaySlot: true
        }
      })
    ]);
    const ranking = classification
      .map(toPublicClassificationRow)
      .filter((row) => includes(row.alias, filters.alias))
      .filter((row) => includes(row.departamento, filters.departamento))
      .filter((row) => includes(row.rango, filters.rango));
    const leader = ranking[0] ?? null;
    const second = ranking[1] ?? null;
    const distributedPoints = ranking.reduce((sum, row) => sum + row.pointsTotal, 0);
    const departments = new Map<string, { total: number; participants: number }>();

    for (const row of ranking) {
      const key = row.departamento ?? "Sin departamento";
      const current = departments.get(key) ?? { total: 0, participants: 0 };
      current.total += row.pointsTotal;
      current.participants += 1;
      departments.set(key, current);
    }

    return {
      leader,
      distanceToSecond: leader && second ? leader.pointsTotal - second.pointsTotal : null,
      participantsCount: ranking.length || participantsCount,
      distributedPoints,
      computedMatches,
      lastUpdatedAt: classification[0]?.updatedAt.toISOString() ?? null,
      nextMatch: nextMatch
        ? {
            matchId: nextMatch.matchId,
            fecha: nextMatch.fecha?.toISOString() ?? null,
            hora: nextMatch.hora,
            homeTeam: formatCountry(nextMatch.homeTeamId, nextMatch.homeTeam ?? nextMatch.homeSlot ?? "Local"),
            awayTeam: formatCountry(nextMatch.awayTeamId, nextMatch.awayTeam ?? nextMatch.awaySlot ?? "Visitante")
          }
        : null,
      ranking,
      departmentAverages: [...departments.entries()].map(([departamento, value]) => ({
        departamento,
        averagePoints: value.participants ? Math.round(value.total / value.participants) : 0,
        participants: value.participants
      })),
      composition: [
        { name: "Partidos", value: ranking.reduce((sum, row) => sum + row.pointsMatches, 0) },
        { name: "Grupos", value: ranking.reduce((sum, row) => sum + row.pointsGroups, 0) },
        { name: "Eliminatorias", value: ranking.reduce((sum, row) => sum + row.pointsEliminatorias, 0) },
        { name: "Bonus", value: ranking.reduce((sum, row) => sum + row.pointsBonus, 0) }
      ]
    };
  } catch {
    return emptyDashboard;
  }
}

export async function getPublicClassification(filters: PublicFilters = {}) {
  return (await getPublicDashboard(filters)).ranking;
}

export async function getPublicParticipant(slug: string): Promise<PublicParticipantProfile | null> {
  noStore();
  try {
    const participant = await prisma.participant.findUnique({
      where: { slug },
      select: {
        slug: true,
        alias: true,
        departamento: true,
        rango: true,
        matchBets: { select: { id: true } },
        generalRanking: {
          select: {
            pos: true,
            participantId: true,
            pointsMatches: true,
            pointsGroups: true,
            pointsEliminatorias: true,
            pointsBonus: true,
            pointsTotal: true,
            deltaPos: true,
            deltaPoints: true,
            exactScores: true,
            correctSigns: true
          }
        }
      }
    });
    if (!participant?.generalRanking) return null;
    return {
      ...toPublicClassificationRow({ ...participant.generalRanking, participant }),
      participantId: participant.generalRanking.participantId,
      betsCount: participant.matchBets.length,
      exactScores: participant.generalRanking.exactScores,
      correctSigns: participant.generalRanking.correctSigns
    };
  } catch {
    return null;
  }
}
