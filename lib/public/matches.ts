import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { MatchStatus } from "@prisma/client";
import type { PublicFilters } from "./filters";
import { summarizePredictionDistribution } from "./matchStats";

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

function dayRange(value?: string) {
  if (!value) return null;
  const start = new Date(`${value}T00:00:00.000Z`);
  const end = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(start.getTime()) ? null : { gte: start, lte: end };
}

function isHiddenR32(match: { fase: string | null; homeTeamId?: string | null; awayTeamId?: string | null; homeTeamIdManual?: string | null; awayTeamIdManual?: string | null; homeTeam?: string | null; awayTeam?: string | null }) {
  const fase = (match.fase ?? "").toLocaleUpperCase("es-ES");
  const isR32 = fase.includes("R32") || fase.includes("1/16");
  if (!isR32) return false;
  const homeResolved = Boolean(match.homeTeamId || match.homeTeamIdManual || match.homeTeam);
  const awayResolved = Boolean(match.awayTeamId || match.awayTeamIdManual || match.awayTeam);
  return !(homeResolved && awayResolved);
}

function statusLabel(status: string) {
  if (status === "OFFICIAL") return "Oficial";
  if (status === "DRAFT") return "Borrador";
  if (status === "VOID") return "Anulado";
  return "Pendiente";
}

export async function getMatchFilterOptions() {
  noStore();
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({ select: { fase: true, grupo: true, jornadaId: true, status: true, fecha: true, homeTeamId: true, awayTeamId: true, homeTeamIdManual: true, awayTeamIdManual: true, homeTeam: true, awayTeam: true }, orderBy: [{ fase: "asc" }, { jornadaId: "asc" }] }),
    prisma.team.findMany({ select: { seleccion: true }, orderBy: { seleccion: "asc" } })
  ]);
  const unique = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "es-ES"));
  return {
    fase: unique(matches.filter((match) => !isHiddenR32(match)).map((match) => match.fase)),
    grupo: unique(matches.filter((match) => !isHiddenR32(match)).map((match) => match.grupo)),
    jornada: unique(matches.filter((match) => !isHiddenR32(match)).map((match) => match.jornadaId)),
    equipo: unique(teams.map((team) => team.seleccion)),
    estado: unique(matches.filter((match) => !isHiddenR32(match)).map((match) => match.status)),
    fecha: unique(matches.filter((match) => !isHiddenR32(match)).map((match) => match.fecha?.toISOString().slice(0, 10)))
  };
}

export async function getPublicMatches(filters: PublicFilters = {}) {
  noStore();
  const dateFilter = dayRange(filters.fecha);
  const status = filters.estado && ["PENDING", "DRAFT", "OFFICIAL", "VOID"].includes(filters.estado) ? (filters.estado as MatchStatus) : undefined;
  const matches = await prisma.match.findMany({
    where: {
      ...(filters.fase ? { fase: { contains: filters.fase, mode: "insensitive" } } : {}),
      ...(filters.grupo ? { grupo: { contains: filters.grupo, mode: "insensitive" } } : {}),
      ...(filters.jornada ? { jornadaId: { contains: filters.jornada, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(dateFilter ? { fecha: dateFilter } : {})
    },
    orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
    include: {
      bets: { select: { predHomeGoals: true, predAwayGoals: true } },
      scoring: { select: { exactOk: true, pointsTotal: true } }
    }
  });

  return matches
    .filter((match) => !isHiddenR32(match))
    .filter((match) =>
      !filters.equipo ||
      includes(match.homeTeam, filters.equipo) ||
      includes(match.awayTeam, filters.equipo) ||
      includes(match.homeTeamId, filters.equipo) ||
      includes(match.awayTeamId, filters.equipo)
    )
    .map((match) => {
      const prediction = summarizePredictionDistribution(match.bets);
      const pointsDistributed = match.scoring.reduce((sum, score) => sum + score.pointsTotal, 0);
      const exactScores = match.scoring.filter((score) => score.exactOk).length;
      return {
        matchId: match.matchId,
        matchNo: match.matchNo,
        fase: match.fase,
        grupo: match.grupo,
        jornadaId: match.jornadaId,
        fecha: match.fecha?.toISOString() ?? null,
        hora: match.hora,
        homeTeam: match.homeTeam ?? match.homeTeamId ?? match.homeSlot ?? "Local",
        awayTeam: match.awayTeam ?? match.awayTeamId ?? match.awaySlot ?? "Visitante",
        status: match.status,
        statusLabel: statusLabel(match.status),
        resultText: match.status === "OFFICIAL" ? match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null) : null,
        qualifiedTeamId: match.status === "OFFICIAL" ? match.qualifiedTeamId ?? match.overrideQualifiedTeamId : null,
        pointsDistributed,
        exactScores,
        prediction
      };
    });
}

export async function getPublicMatchDetail(matchId: string) {
  noStore();
  const match = await prisma.match.findUnique({
    where: { matchId },
    include: {
      bets: {
        select: {
          participantId: true,
          predHomeGoals: true,
          predAwayGoals: true,
          predQualifiedTeamId: true,
          participant: { select: { alias: true, departamento: true, rango: true, slug: true } }
        }
      },
      scoring: { select: { participantId: true, exactOk: true, diffOk: true, signOk: true, qualifiedOk: true, pointsTotal: true } }
    }
  });
  if (!match || isHiddenR32(match)) return null;
  const scoreByParticipant = new Map(match.scoring.map((score) => [score.participantId, score]));
  const prediction = summarizePredictionDistribution(match.bets);
  return {
    match: {
      matchId: match.matchId,
      matchNo: match.matchNo,
      fase: match.fase,
      grupo: match.grupo,
      jornadaId: match.jornadaId,
      fecha: match.fecha?.toISOString() ?? null,
      hora: match.hora,
      homeTeam: match.homeTeam ?? match.homeTeamId ?? match.homeSlot ?? "Local",
      awayTeam: match.awayTeam ?? match.awayTeamId ?? match.awaySlot ?? "Visitante",
      status: match.status,
      statusLabel: statusLabel(match.status),
      resultText: match.status === "OFFICIAL" ? match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null) : null,
      qualifiedTeamId: match.status === "OFFICIAL" ? match.qualifiedTeamId ?? match.overrideQualifiedTeamId : null
    },
    prediction,
    pointsDistributed: match.scoring.reduce((sum, score) => sum + score.pointsTotal, 0),
    exactScores: match.scoring.filter((score) => score.exactOk).length,
    bets: [...match.bets].sort((a, b) => a.participant.alias.localeCompare(b.participant.alias, "es-ES")).map((bet) => {
      const score = scoreByParticipant.get(bet.participantId);
      return {
        participantId: bet.participantId,
        alias: bet.participant.alias,
        slug: bet.participant.slug,
        departamento: bet.participant.departamento,
        rango: bet.participant.rango,
        prediction: bet.predHomeGoals == null || bet.predAwayGoals == null ? "-" : `${bet.predHomeGoals}-${bet.predAwayGoals}`,
        predQualifiedTeamId: bet.predQualifiedTeamId,
        pointsTotal: score?.pointsTotal ?? 0,
        exactOk: score?.exactOk ?? false,
        signOk: score?.signOk ?? false,
        diffOk: score?.diffOk ?? false,
        qualifiedOk: score?.qualifiedOk ?? false
      };
    })
  };
}

