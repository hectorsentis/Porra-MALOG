import { calculateRanking } from "./ranking";
import type { RankingInput, RankingRow, SimulationInput } from "./types";

export function simulateRanking(input: SimulationInput): RankingRow[] {
  const byParticipant = new Map<string, RankingInput>();

  for (const participant of input.participants) {
    byParticipant.set(participant.participantId, { ...participant });
  }

  for (const score of input.matchScores ?? []) {
    const current = byParticipant.get(score.participantId);
    if (current) {
      current.pointsMatches = (current.pointsMatches ?? 0) + score.pointsTotal;
    }
  }

  for (const score of input.groupScores ?? []) {
    const current = byParticipant.get(score.participantId);
    if (current) {
      current.pointsGroups = (current.pointsGroups ?? 0) + score.pointsTotal;
    }
  }

  for (const score of input.bonusScores ?? []) {
    const current = byParticipant.get(score.participantId);
    if (current) {
      current.pointsBonus = (current.pointsBonus ?? 0) + score.pointsTotal;
    }
  }

  return calculateRanking([...byParticipant.values()]);
}
