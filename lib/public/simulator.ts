import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { scoreMatch } from "@/lib/game/scoreMatch";
import { simulateRanking } from "@/lib/game/simulator";
import type { PublicFilters } from "./filters";

function isResolvedMatch(match: { fase: string | null; homeTeamId: string | null; awayTeamId: string | null; homeTeam: string | null; awayTeam: string | null }) {
  const fase = (match.fase ?? "").toLocaleUpperCase("es-ES");
  const isR32 = fase.includes("R32") || fase.includes("1/16");
  if (!isR32) return true;
  return Boolean((match.homeTeamId || match.homeTeam) && (match.awayTeamId || match.awayTeam));
}

function readNumber(value?: string) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function getSimulatorData(filters: PublicFilters & { homeGoals?: string; awayGoals?: string; qualifiedTeamId?: string }) {
  noStore();
  const [rankings, matches] = await Promise.all([
    prisma.generalRanking.findMany({ orderBy: { pos: "asc" } }),
    prisma.match.findMany({
      where: { status: { not: "OFFICIAL" } },
      select: { matchId: true, matchNo: true, fase: true, grupo: true, jornadaId: true, fecha: true, homeTeamId: true, awayTeamId: true, homeTeam: true, awayTeam: true, homeSlot: true, awaySlot: true },
      orderBy: [{ fecha: "asc" }, { matchNo: "asc" }]
    })
  ]);
  const availableMatches = matches.filter(isResolvedMatch).map((match) => ({
    matchId: match.matchId,
    label: `${match.matchId} - ${formatCountry(match.homeTeamId, match.homeTeam ?? match.homeSlot ?? "Local")} vs ${formatCountry(match.awayTeamId, match.awayTeam ?? match.awaySlot ?? "Visitante")}`,
    homeTeam: formatCountry(match.homeTeamId, match.homeTeam ?? match.homeSlot ?? "Local"),
    awayTeam: formatCountry(match.awayTeamId, match.awayTeam ?? match.awaySlot ?? "Visitante"),
    fase: match.fase,
    jornadaId: match.jornadaId,
    fecha: match.fecha?.toISOString() ?? null
  }));
  const selectedMatchId = filters.partido ?? availableMatches[0]?.matchId ?? null;
  const homeGoals = readNumber(filters.homeGoals);
  const awayGoals = readNumber(filters.awayGoals);
  const baseRanking = rankings.map((row) => ({
    participantId: row.participantId,
    alias: row.alias,
    departamento: row.departamento,
    rango: row.rango,
    pointsMatches: row.pointsMatches,
    pointsGroups: row.pointsGroups,
    pointsEliminatorias: row.pointsEliminatorias,
    pointsBonus: row.pointsBonus,
    previousPos: row.pos,
    previousPoints: row.pointsTotal
  }));

  if (!selectedMatchId || homeGoals == null || awayGoals == null) {
    return { availableMatches, selectedMatchId, homeGoals, awayGoals, projected: null, baseRanking: rankings.slice(0, 12) };
  }

  const match = await prisma.match.findUnique({
    where: { matchId: selectedMatchId },
    include: { bets: true }
  });
  if (!match || match.status === "OFFICIAL" || !isResolvedMatch(match)) {
    return { availableMatches, selectedMatchId, homeGoals, awayGoals, projected: null, baseRanking: rankings.slice(0, 12) };
  }

  const scores = match.bets.map((bet) => scoreMatch(
    {
      betId: bet.betId,
      participantId: bet.participantId,
      matchId: bet.matchId,
      fase: bet.fase,
      predHomeTeamId: bet.predHomeTeamId,
      predAwayTeamId: bet.predAwayTeamId,
      predHomeGoals: bet.predHomeGoals,
      predAwayGoals: bet.predAwayGoals,
      predQualifiedTeamId: bet.predQualifiedTeamId
    },
    {
      matchId: match.matchId,
      fase: match.fase,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeGoals,
      awayGoals,
      qualifiedTeamId: filters.qualifiedTeamId || null,
      finished: true
    }
  ));
  const projected = simulateRanking({ participants: baseRanking, matchScores: scores }).slice(0, 20);
  return { availableMatches, selectedMatchId, homeGoals, awayGoals, projected, baseRanking: rankings.slice(0, 12) };
}
