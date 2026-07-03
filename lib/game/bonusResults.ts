import type { PrismaClient } from "@prisma/client";
import { getTournamentBonusOverride } from "@/lib/admin/bonusOverrides";
import type { BonusResultInput } from "./types";
import { isOfficialMatchForScoring } from "./matchStatus";

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

function overrideList(value: string | null | undefined, fallback: string[]) {
  const list = splitManualList(value);
  return list.length > 0 ? list : fallback;
}

function overrideValue(value: string | null | undefined, fallback: string | null) {
  return value == null || value === "" ? fallback : value;
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
    getTournamentBonusOverride().catch(() => null)
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
  const autoCampeon = final ? qualifiedTeam(final) : null;
  const autoSubcampeon = final ? loserTeam(final) : null;

  return {
    bonusLocked: config?.bonusLockedOverride ?? bonusLocked,
    campeon: overrideValue(config?.campeon, autoCampeon),
    subcampeon: overrideValue(config?.subcampeon, autoSubcampeon),
    semifinalistas: overrideList(config?.semifinalistas, semifinalistas),
    maximoGoleador: splitManualList(config?.maximoGoleador),
    seleccionMasGoleadora: overrideList(config?.seleccionMasGoleadora, tiedByGoals(performances, "tournamentGf", "max")),
    seleccionMasGoleada: overrideList(config?.seleccionMasGoleada, tiedByGoals(performances, "tournamentGc", "max")),
    seleccionMenosGoleadora: overrideList(config?.seleccionMenosGoleadora, tiedByGoals(performances, "tournamentGf", "min")),
    seleccionMenosGoleada: overrideList(config?.seleccionMenosGoleada, tiedByGoals(performances, "tournamentGc", "min")),
    equipoRevelacion: overrideList(config?.equipoRevelacion, revelation(performances, rankByTeam)),
    equipoDecepcion: overrideList(config?.equipoDecepcion, disappointment(performances, rankByTeam)),
    totalGolesTorneo: config?.totalGolesTorneo ?? totalGolesTorneo
  };
}
