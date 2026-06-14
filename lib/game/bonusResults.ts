import type { PrismaClient } from "@prisma/client";
import type { BonusResultInput } from "./types";
import { isOfficialMatchForScoring } from "./matchStatus";

type BonusConfig = {
  maximoGoleador: string | null;
};

type BonusDb = {
  tournamentBonusResult: {
    findUnique: (args: { where: { id: string } }) => Promise<BonusConfig | null>;
  };
};

type BonusMatch = {
  fase: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string | null;
  qualifiedTeamId: string | null;
  overrideQualifiedTeamId: string | null;
  status: string;
  finished: boolean;
};

type BonusPerformance = {
  teamId: string;
  roundValue: number;
  tournamentGf: number;
  tournamentGc: number;
};

export type TournamentBonusResult = BonusResultInput & {
  bonusLocked: boolean;
  totalGolesTorneo: number | null;
};

function phaseKey(fase: string | null | undefined) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  if (value.includes("FINAL")) return "FINAL";
  if (value.includes("SF") || value.includes("SEMI")) return "SF";
  if (value.includes("TERCER")) return "TERCER_PUESTO";
  return value;
}

function qualifiedTeam(match: BonusMatch) {
  return match.overrideQualifiedTeamId ?? match.qualifiedTeamId ?? match.winnerTeamId;
}

function loserTeam(match: BonusMatch) {
  const winner = qualifiedTeam(match);
  if (!winner) return null;
  if (match.homeTeamId === winner) return match.awayTeamId;
  if (match.awayTeamId === winner) return match.homeTeamId;
  return null;
}

function splitManualList(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function tiedByGoals(rows: BonusPerformance[], field: "tournamentGf" | "tournamentGc", direction: "max" | "min") {
  if (rows.length === 0) return [];
  const target = direction === "max"
    ? Math.max(...rows.map((row) => row[field]))
    : Math.min(...rows.map((row) => row[field]));
  return rows
    .filter((row) => row[field] === target)
    .map((row) => row.teamId)
    .sort((a, b) => a.localeCompare(b, "es-ES"));
}

function revelation(rows: BonusPerformance[], rankByTeam: Map<string, number | null>) {
  if (rows.length === 0) return [];
  const bestRound = Math.max(...rows.map((row) => row.roundValue));
  const roundRows = rows.filter((row) => row.roundValue === bestRound);
  const weakestRank = Math.max(...roundRows.map((row) => rankByTeam.get(row.teamId) ?? 999));
  return roundRows
    .filter((row) => (rankByTeam.get(row.teamId) ?? 999) === weakestRank)
    .map((row) => row.teamId)
    .sort((a, b) => a.localeCompare(b, "es-ES"));
}

function disappointment(rows: BonusPerformance[], rankByTeam: Map<string, number | null>) {
  if (rows.length === 0) return [];
  const worstRound = Math.min(...rows.map((row) => row.roundValue));
  const roundRows = rows.filter((row) => row.roundValue === worstRound);
  const strongestRank = Math.min(...roundRows.map((row) => rankByTeam.get(row.teamId) ?? 999));
  return roundRows
    .filter((row) => (rankByTeam.get(row.teamId) ?? 999) === strongestRank)
    .map((row) => row.teamId)
    .sort((a, b) => a.localeCompare(b, "es-ES"));
}

export async function getTournamentBonusResult(prisma: PrismaClient): Promise<TournamentBonusResult> {
  const db = prisma as unknown as BonusDb;
  const [matches, performances, teams, config] = await Promise.all([
    prisma.match.findMany({
      select: {
        fase: true,
        homeTeamId: true,
        awayTeamId: true,
        homeGoals: true,
        awayGoals: true,
        winnerTeamId: true,
        qualifiedTeamId: true,
        overrideQualifiedTeamId: true,
        status: true,
        finished: true
      }
    }),
    (prisma as unknown as { tournamentTeamPerformance: { findMany: () => Promise<BonusPerformance[]> } }).tournamentTeamPerformance.findMany(),
    prisma.team.findMany({ select: { teamId: true, fifaRank: true } }),
    db.tournamentBonusResult.findUnique({ where: { id: "default" } })
  ]);

  const final = matches.find((match) => phaseKey(match.fase) === "FINAL" && isOfficialMatchForScoring(match));
  const bonusLocked = Boolean(final);
  const rankByTeam = new Map(teams.map((team) => [team.teamId, team.fifaRank]));
  const semifinalistas = [
    ...new Set(
      matches
        .filter((match) => phaseKey(match.fase) === "SF")
        .flatMap((match) => [match.homeTeamId, match.awayTeamId])
        .filter((teamId): teamId is string => Boolean(teamId))
    )
  ];
  const officialMatches = matches.filter(isOfficialMatchForScoring);
  const totalGolesTorneo = officialMatches.reduce((sum, match) => sum + (match.homeGoals ?? 0) + (match.awayGoals ?? 0), 0);

  return {
    bonusLocked,
    campeon: final ? qualifiedTeam(final) : null,
    subcampeon: final ? loserTeam(final) : null,
    semifinalistas,
    maximoGoleador: splitManualList(config?.maximoGoleador),
    seleccionMasGoleadora: tiedByGoals(performances, "tournamentGf", "max"),
    seleccionMasGoleada: tiedByGoals(performances, "tournamentGc", "max"),
    seleccionMenosGoleadora: tiedByGoals(performances, "tournamentGf", "min"),
    seleccionMenosGoleada: tiedByGoals(performances, "tournamentGc", "min"),
    equipoRevelacion: revelation(performances, rankByTeam),
    equipoDecepcion: disappointment(performances, rankByTeam),
    totalGolesTorneo
  };
}
