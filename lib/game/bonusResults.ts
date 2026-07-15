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

export type BonusPerformance = {
  teamId: string;
  reachedRound?: string;
  roundValue: number;
  tournamentGf: number;
  tournamentGc: number;
};

const REVELATION_MIN_ROUND_VALUE = 3;
const DISAPPOINTMENT_MAX_ROUND_VALUE = 2;
const TOURNAMENT_MAX_ROUND_VALUE = 6;

export type BonusTeamScore = {
  teamId: string;
  reachedRound: string;
  roundValue: number;
  fifaRank: number | null;
  revelationScore: number | null;
  revelationRank: number | null;
  revelationLeader: boolean;
  disappointmentScore: number | null;
  disappointmentRank: number | null;
  disappointmentLeader: boolean;
};

export type BonusGoalMetric = {
  teamId: string;
  goals: number | null;
};

export type TournamentBonusGoalMetrics = {
  seleccionMasGoleadora: BonusGoalMetric[];
  seleccionMasGoleada: BonusGoalMetric[];
  seleccionMenosGoleadora: BonusGoalMetric[];
  seleccionMenosGoleada: BonusGoalMetric[];
};

export type TournamentBonusResult = BonusResultInput & {
  bonusLocked: boolean;
  totalGolesTorneo: number | null;
  teamScores: BonusTeamScore[];
  goalMetrics: TournamentBonusGoalMetrics;
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

export function calculateRevelationTeams(rows: BonusPerformance[], rankByTeam: Map<string, number | null>) {
  return calculateBonusTeamScores(rows, rankByTeam)
    .filter((row) => row.revelationLeader)
    .map((row) => row.teamId)
    .sort((a, b) => a.localeCompare(b, "es-ES"));
}

export function calculateDisappointmentTeams(rows: BonusPerformance[], rankByTeam: Map<string, number | null>) {
  return calculateBonusTeamScores(rows, rankByTeam)
    .filter((row) => row.disappointmentLeader)
    .map((row) => row.teamId)
    .sort((a, b) => a.localeCompare(b, "es-ES"));
}

function reachedRoundLabel(row: BonusPerformance) {
  if (row.reachedRound) return row.reachedRound;
  if (row.roundValue >= 6) return "FINAL";
  if (row.roundValue === 5) return "SF";
  if (row.roundValue === 4) return "QF";
  if (row.roundValue === 3) return "R16";
  if (row.roundValue === 2) return "R32";
  return "GRUPOS";
}

function scoreRanks(rows: Array<{ teamId: string; score: number }>) {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.teamId.localeCompare(b.teamId, "es-ES"));
  const ranks = new Map<string, number>();
  let previousScore: number | null = null;
  let previousRank = 0;
  sorted.forEach((row, index) => {
    const rank = previousScore === row.score ? previousRank : index + 1;
    ranks.set(row.teamId, rank);
    previousScore = row.score;
    previousRank = rank;
  });
  return ranks;
}

export function calculateBonusTeamScores(rows: BonusPerformance[], rankByTeam: Map<string, number | null>): BonusTeamScore[] {
  const validFifaRanks = rows
    .map((row) => rankByTeam.get(row.teamId))
    .filter((rank): rank is number => rank != null && rank > 0);
  const maxFifaRank = validFifaRanks.length > 0 ? Math.max(...validFifaRanks) : null;

  const rawRows = rows.map((row) => {
    const fifaRank = rankByTeam.get(row.teamId);
    const validFifaRank = fifaRank != null && fifaRank > 0 ? fifaRank : null;
    const revelationScore = validFifaRank != null && row.roundValue >= REVELATION_MIN_ROUND_VALUE
      ? row.roundValue * validFifaRank
      : null;
    const disappointmentScore = validFifaRank != null && maxFifaRank != null && row.roundValue <= DISAPPOINTMENT_MAX_ROUND_VALUE
      ? (TOURNAMENT_MAX_ROUND_VALUE + 1 - row.roundValue) * (maxFifaRank + 1 - validFifaRank)
      : null;
    return {
      teamId: row.teamId,
      reachedRound: reachedRoundLabel(row),
      roundValue: row.roundValue,
      fifaRank: validFifaRank,
      revelationScore,
      disappointmentScore
    };
  });

  const revelationRanks = scoreRanks(
    rawRows.flatMap((row) => row.revelationScore == null ? [] : [{ teamId: row.teamId, score: row.revelationScore }])
  );
  const disappointmentRanks = scoreRanks(
    rawRows.flatMap((row) => row.disappointmentScore == null ? [] : [{ teamId: row.teamId, score: row.disappointmentScore }])
  );

  return rawRows.map((row) => ({
    ...row,
    revelationRank: revelationRanks.get(row.teamId) ?? null,
    revelationLeader: revelationRanks.get(row.teamId) === 1,
    disappointmentRank: disappointmentRanks.get(row.teamId) ?? null,
    disappointmentLeader: disappointmentRanks.get(row.teamId) === 1
  }));
}

export function goalMetricsForTeams(
  value: string | string[] | null | undefined,
  rows: BonusPerformance[],
  field: "tournamentGf" | "tournamentGc"
): BonusGoalMetric[] {
  const teamIds = Array.isArray(value) ? value : value ? [value] : [];
  const performanceByTeam = new Map(rows.map((row) => [row.teamId, row]));
  return teamIds.map((teamId) => ({
    teamId,
    goals: performanceByTeam.get(teamId)?.[field] ?? null
  }));
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
  const teamScores = calculateBonusTeamScores(performances, rankByTeam);
  const seleccionMasGoleadora = overrideList(config?.seleccionMasGoleadora, tiedByGoals(performances, "tournamentGf", "max"));
  const seleccionMasGoleada = overrideList(config?.seleccionMasGoleada, tiedByGoals(performances, "tournamentGc", "max"));
  const seleccionMenosGoleadora = overrideList(config?.seleccionMenosGoleadora, tiedByGoals(performances, "tournamentGf", "min"));
  const seleccionMenosGoleada = overrideList(config?.seleccionMenosGoleada, tiedByGoals(performances, "tournamentGc", "min"));

  return {
    bonusLocked: config?.bonusLockedOverride ?? bonusLocked,
    campeon: overrideValue(config?.campeon, autoCampeon),
    subcampeon: overrideValue(config?.subcampeon, autoSubcampeon),
    semifinalistas: overrideList(config?.semifinalistas, semifinalistas),
    maximoGoleador: splitManualList(config?.maximoGoleador),
    seleccionMasGoleadora,
    seleccionMasGoleada,
    seleccionMenosGoleadora,
    seleccionMenosGoleada,
    equipoRevelacion: overrideList(config?.equipoRevelacion, calculateRevelationTeams(performances, rankByTeam)),
    equipoDecepcion: overrideList(config?.equipoDecepcion, calculateDisappointmentTeams(performances, rankByTeam)),
    totalGolesTorneo: config?.totalGolesTorneo ?? totalGolesTorneo,
    teamScores,
    goalMetrics: {
      seleccionMasGoleadora: goalMetricsForTeams(seleccionMasGoleadora, performances, "tournamentGf"),
      seleccionMasGoleada: goalMetricsForTeams(seleccionMasGoleada, performances, "tournamentGc"),
      seleccionMenosGoleadora: goalMetricsForTeams(seleccionMenosGoleadora, performances, "tournamentGf"),
      seleccionMenosGoleada: goalMetricsForTeams(seleccionMenosGoleada, performances, "tournamentGc")
    }
  };
}
