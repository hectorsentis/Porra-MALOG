
import { prisma } from "@/lib/prisma";
import { formatCountry, formatCountryOrNull } from "@/lib/countries";
import { isGroupPhase } from "@/lib/game/scoreMatch";
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
  predHomeTeam: string | null;
  predAwayTeam: string | null;
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
  realPos: number | null;
  qualifiedOk: boolean;
  exactPositionOk: boolean;
  pointsTotal: number;
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

  const [matchBets, scoringMatches, groupBets, scoringGroups, bonusBet] = await Promise.all([
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
    prisma.scoringGroup.findMany({ where: { participantId } }),
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
        homeTeam: formatCountry(match.homeTeamId, match.homeTeam ?? match.homeSlot ?? "Local"),
        awayTeam: formatCountry(match.awayTeamId, match.awayTeam ?? match.awaySlot ?? "Visitante"),
        status: match.status,
        statusLabel: statusLabel(match.status),
        prediction: bet.predHomeGoals == null || bet.predAwayGoals == null ? "-" : `${bet.predHomeGoals}-${bet.predAwayGoals}`,
        predSign: predictionSign(bet.predHomeGoals, bet.predAwayGoals),
        predHomeTeam: isGroupPhase(match.fase) ? null : formatCountryOrNull(bet.predHomeTeamId, bet.predHomeTeamId),
        predAwayTeam: isGroupPhase(match.fase) ? null : formatCountryOrNull(bet.predAwayTeamId, bet.predAwayTeamId),
        predQualifiedTeamId: isGroupPhase(match.fase) ? null : formatCountryOrNull(bet.predQualifiedTeamId, bet.predQualifiedTeamId),
        resultText: isOfficial ? match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null) : null,
        realSign: isOfficial ? predictionSign(match.homeGoals, match.awayGoals) : "Pendiente",
        qualifiedTeamId: isOfficial && !isGroupPhase(match.fase) ? formatCountryOrNull(match.overrideQualifiedTeamId ?? match.qualifiedTeamId, match.overrideQualifiedTeamId ?? match.qualifiedTeamId) : null,
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

  const scoringGroupKey = (grupo: string, predPos: number) => `${grupo}:${predPos}`;
  const scoringGroupMap = new Map(scoringGroups.map((s) => [scoringGroupKey(s.grupo, s.predPos), s]));

  const groups: ParticipantGroupBet[] = groupBets
    .map((bet) => {
      const scoring = scoringGroupMap.get(scoringGroupKey(bet.grupo, bet.predPos));
      return {
        grupo: bet.grupo,
        predPos: bet.predPos,
        predTeamId: formatCountry(bet.predTeamId, bet.predTeamId),
        realPos: scoring?.realPos ?? null,
        qualifiedOk: scoring?.qualifiedOk ?? false,
        exactPositionOk: scoring?.exactPositionOk ?? false,
        pointsTotal: scoring?.pointsTotal ?? 0
      };
    })
    .sort((a, b) => a.grupo.localeCompare(b.grupo, "es-ES") || a.predPos - b.predPos);

  const bonus: ParticipantBonusBet | null = bonusBet
    ? {
        campeon: formatCountryOrNull(null, bonusBet.campeon),
        subcampeon: formatCountryOrNull(null, bonusBet.subcampeon),
        semifinalistas: [bonusBet.semifinalista1, bonusBet.semifinalista2, bonusBet.semifinalista3, bonusBet.semifinalista4].map((value) => formatCountryOrNull(null, value)).filter(
          (value): value is string => Boolean(value)
        ),
        maximoGoleador: bonusBet.maximoGoleador,
        seleccionMasGoleadora: formatCountryOrNull(null, bonusBet.seleccionMasGoleadora),
        seleccionMasGoleada: formatCountryOrNull(null, bonusBet.seleccionMasGoleada),
        seleccionMenosGoleadora: formatCountryOrNull(null, bonusBet.seleccionMenosGoleadora),
        seleccionMenosGoleada: formatCountryOrNull(null, bonusBet.seleccionMenosGoleada),
        equipoRevelacion: formatCountryOrNull(null, bonusBet.equipoRevelacion),
        equipoDecepcion: formatCountryOrNull(null, bonusBet.equipoDecepcion),
        totalGolesTorneo: bonusBet.totalGolesTorneo
      }
    : null;

  return { matches, groups, bonus };
}
