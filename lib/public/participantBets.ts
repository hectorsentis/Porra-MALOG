import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { predictionSign } from "./matchStats";

function statusLabel(status: string) {
  if (status === "OFFICIAL") return "Oficial";
  if (status === "DRAFT") return "Borrador";
  if (status === "VOID") return "Anulado";
  return "Pendiente";
}

export type ParticipantMatchBet = {
  matchId: string;
  matchNo: number | null;
  fase: string | null;
  grupo: string | null;
  jornadaId: string | null;
  fecha: string | null;
  hora: string | null;
  homeTeam: string;
  awayTeam: string;
  status: string;
  statusLabel: string;
  prediction: string;
  predSign: string;
  predQualifiedTeamId: string | null;
  resultText: string | null;
  realSign: string;
  qualifiedTeamId: string | null;
  score: {
    exactOk: boolean;
    diffOk: boolean;
    signOk: boolean;
    qualifiedOk: boolean;
    cruceExactoOk: boolean;
    spainMatch: boolean;
    multiplier: number;
    pointsTotal: number;
  } | null;
};

export type ParticipantGroupBet = {
  grupo: string;
  predPos: number;
  predTeamId: string | null;
};

export type ParticipantBonusBet = {
  campeon: string | null;
  subcampeon: string | null;
  semifinalistas: string[];
  maximoGoleador: string | null;
  seleccionMasGoleadora: string | null;
  seleccionMasGoleada: string | null;
  seleccionMenosGoleadora: string | null;
  seleccionMenosGoleada: string | null;
  equipoRevelacion: string | null;
  equipoDecepcion: string | null;
  totalGolesTorneo: number | null;
};

export type ParticipantBetsData = {
  matches: ParticipantMatchBet[];
  groups: ParticipantGroupBet[];
  bonus: ParticipantBonusBet | null;
};

export async function getPublicParticipantBets(participantId: string): Promise<ParticipantBetsData> {
  noStore();

  const [matchBets, scoringMatches, groupBets, bonusBet] = await Promise.all([
    prisma.betMatch.findMany({
      where: { participantId },
      include: {
        match: {
          select: {
            matchId: true,
            matchNo: true,
            fase: true,
            grupo: true,
            jornadaId: true,
            fecha: true,
            hora: true,
            homeTeam: true,
            awayTeam: true,
            homeTeamId: true,
            awayTeamId: true,
            homeSlot: true,
            awaySlot: true,
            status: true,
            resultText: true,
            homeGoals: true,
            awayGoals: true,
            qualifiedTeamId: true,
            overrideQualifiedTeamId: true
          }
        }
      }
    }),
    prisma.scoringMatch.findMany({ where: { participantId } }),
    prisma.betGroupPosition.findMany({ where: { participantId, valid: true } }),
    prisma.betBonus.findUnique({ where: { participantId } })
  ]);

  const scoreByMatch = new Map(scoringMatches.map((score) => [score.matchId, score]));

  const matches: ParticipantMatchBet[] = matchBets
    .map((bet) => {
      const match = bet.match;
      const score = scoreByMatch.get(bet.matchId) ?? null;
      const isOfficial = match.status === "OFFICIAL";
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
        prediction: bet.predHomeGoals == null || bet.predAwayGoals == null ? "-" : `${bet.predHomeGoals}-${bet.predAwayGoals}`,
        predSign: predictionSign(bet.predHomeGoals, bet.predAwayGoals),
        predQualifiedTeamId: bet.predQualifiedTeamId,
        resultText: isOfficial ? match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null) : null,
        realSign: isOfficial ? predictionSign(match.homeGoals, match.awayGoals) : "Pendiente",
        qualifiedTeamId: isOfficial ? match.overrideQualifiedTeamId ?? match.qualifiedTeamId : null,
        score: score
          ? {
              exactOk: score.exactOk,
              diffOk: score.diffOk,
              signOk: score.signOk,
              qualifiedOk: score.qualifiedOk,
              cruceExactoOk: score.cruceExactoOk,
              spainMatch: score.spainMatch,
              multiplier: score.multiplier,
              pointsTotal: score.pointsTotal
            }
          : null
      };
    })
    .sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      return (a.matchNo ?? 0) - (b.matchNo ?? 0);
    });

  const groups: ParticipantGroupBet[] = groupBets
    .map((bet) => ({ grupo: bet.grupo, predPos: bet.predPos, predTeamId: bet.predTeamId }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, "es-ES") || a.predPos - b.predPos);

  const bonus: ParticipantBonusBet | null = bonusBet
    ? {
        campeon: bonusBet.campeon,
        subcampeon: bonusBet.subcampeon,
        semifinalistas: [bonusBet.semifinalista1, bonusBet.semifinalista2, bonusBet.semifinalista3, bonusBet.semifinalista4].filter(
          (value): value is string => Boolean(value)
        ),
        maximoGoleador: bonusBet.maximoGoleador,
        seleccionMasGoleadora: bonusBet.seleccionMasGoleadora,
        seleccionMasGoleada: bonusBet.seleccionMasGoleada,
        seleccionMenosGoleadora: bonusBet.seleccionMenosGoleadora,
        seleccionMenosGoleada: bonusBet.seleccionMenosGoleada,
        equipoRevelacion: bonusBet.equipoRevelacion,
        equipoDecepcion: bonusBet.equipoDecepcion,
        totalGolesTorneo: bonusBet.totalGolesTorneo
      }
    : null;

  return { matches, groups, bonus };
}
