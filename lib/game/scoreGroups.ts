import { defaultRules, type GameRules } from "./rules";
import type { GroupBetInput, GroupScore, GroupStandingInput } from "./types";

function isQualified(standing?: GroupStandingInput): boolean {
  if (!standing) return false;
  if (standing.status) {
    return ["qualified", "clasificado", "q", "true", "yes", "si", "sí"].includes(
      standing.status.trim().toLowerCase()
    );
  }
  return standing.pos <= 2;
}

export function scoreGroupBet(
  bet: GroupBetInput,
  standings: GroupStandingInput[],
  rules: GameRules = defaultRules
): GroupScore {
  const standing = standings.find(
    (item) =>
      item.grupo.trim().toUpperCase() === bet.grupo.trim().toUpperCase() &&
      item.teamId.trim().toUpperCase() === bet.predTeamId?.trim().toUpperCase()
  );
  const valid = bet.valid !== false && Boolean(bet.predTeamId);
  const qualifiedOk = valid && isQualified(standing);
  const exactPositionOk = valid && Boolean(standing && standing.pos === bet.predPos);
  const pointsQualified = qualifiedOk ? rules.groupQualified : 0;
  const pointsPosition = exactPositionOk ? rules.groupExactPosition : 0;

  return {
    groupBetId: bet.groupBetId,
    participantId: bet.participantId,
    grupo: bet.grupo,
    predPos: bet.predPos,
    predTeamId: bet.predTeamId,
    realPos: standing?.pos ?? null,
    realStatus: standing?.status ?? null,
    qualifiedOk,
    exactPositionOk,
    pointsQualified,
    pointsPosition,
    pointsTotal: pointsQualified + pointsPosition
  };
}

export function scoreGroups(
  bets: GroupBetInput[],
  standings: GroupStandingInput[],
  rules: GameRules = defaultRules
): GroupScore[] {
  return bets.map((bet) => scoreGroupBet(bet, standings, rules));
}
