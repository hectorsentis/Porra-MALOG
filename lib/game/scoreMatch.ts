import { defaultRules, spainTeamIds, type GameRules } from "./rules";
import type { MatchBetInput, MatchResultInput, MatchScore, MatchSign } from "./types";

export function getSign(homeGoals?: number | null, awayGoals?: number | null): MatchSign | null {
  if (homeGoals == null || awayGoals == null) return null;
  if (homeGoals > awayGoals) return "1";
  if (homeGoals < awayGoals) return "2";
  return "X";
}

export function getGoalDiff(homeGoals?: number | null, awayGoals?: number | null): number | null {
  if (homeGoals == null || awayGoals == null) return null;
  return homeGoals - awayGoals;
}

function sameTeam(left?: string | null, right?: string | null): boolean {
  return Boolean(left && right && left.trim().toUpperCase() === right.trim().toUpperCase());
}

function isGroupPhase(fase?: string | null): boolean {
  return (fase ?? "").toLocaleUpperCase("es-ES").includes("GRUPO");
}

function knockoutQualifiedPoints(fase: string | null | undefined, rules: GameRules): number {
  const raw = (fase ?? "").toLocaleUpperCase("es-ES");
  if (raw.includes("TERCER") || raw.includes("THIRD")) return rules.koThirdPlace;
  if (raw.includes("FINAL")) return rules.koChampion;
  if (raw.includes("SEMIF") || raw.includes("1/2") || raw.includes("SF")) return rules.koSfQualified;
  if (raw.includes("CUART") || raw.includes("1/4") || raw.includes("QF")) return rules.koQfQualified;
  if (raw.includes("OCTAV") || raw.includes("1/8") || raw.includes("R16")) return rules.koR16Qualified;
  if (raw.includes("1/16") || raw.includes("DIECISEIS") || raw.includes("R32")) return rules.koR32Qualified;
  return rules.qualifiedTeam;
}
function isSpainMatch(result: MatchResultInput): boolean {
  const home = result.homeTeamId?.trim().toUpperCase();
  const away = result.awayTeamId?.trim().toUpperCase();
  return Boolean((home && spainTeamIds.has(home)) || (away && spainTeamIds.has(away)));
}

export function scoreMatch(
  bet: MatchBetInput,
  result: MatchResultInput,
  rules: GameRules = defaultRules
): MatchScore {
  const predSign = getSign(bet.predHomeGoals, bet.predAwayGoals);
  const predGoalDiff = getGoalDiff(bet.predHomeGoals, bet.predAwayGoals);
  const realSign = getSign(result.homeGoals, result.awayGoals);
  const realGoalDiff = getGoalDiff(result.homeGoals, result.awayGoals);
  const finished = result.finished !== false && result.homeGoals != null && result.awayGoals != null;

  const exactOk = finished && bet.predHomeGoals === result.homeGoals && bet.predAwayGoals === result.awayGoals;
  const diffOk = finished && predGoalDiff != null && predGoalDiff === realGoalDiff;
  const signOk = finished && predSign != null && predSign === realSign;
  const qualifiedOk = Boolean(
    finished &&
      bet.predQualifiedTeamId &&
      result.qualifiedTeamId &&
      sameTeam(bet.predQualifiedTeamId, result.qualifiedTeamId)
  );
  const cruceExactoOk = Boolean(
    finished &&
      !isGroupPhase(result.fase) &&
      bet.predHomeTeamId &&
      bet.predAwayTeamId &&
      sameTeam(bet.predHomeTeamId, result.homeTeamId) &&
      sameTeam(bet.predAwayTeamId, result.awayTeamId)
  );
  const spainMatch = isSpainMatch(result);
  const multiplier = spainMatch ? rules.spainMultiplier : 1;

  const baseResultPoints = exactOk ? rules.exactScore : diffOk ? rules.correctGoalDiff : signOk ? rules.correctSign : 0;
  const pointsResult = baseResultPoints * multiplier;
  const pointsQualified = qualifiedOk ? knockoutQualifiedPoints(result.fase, rules) : 0;
  const pointsCruceExacto = cruceExactoOk ? rules.exactCrossing : 0;

  return {
    betId: bet.betId,
    participantId: bet.participantId,
    matchId: bet.matchId,
    fase: bet.fase ?? result.fase,
    predSign,
    predGoalDiff,
    realSign,
    realGoalDiff,
    exactOk,
    diffOk,
    signOk,
    qualifiedOk,
    cruceExactoOk,
    spainMatch,
    multiplier,
    pointsResult,
    pointsQualified,
    pointsCruceExacto,
    pointsTotal: pointsResult + pointsQualified + pointsCruceExacto
  };
}

