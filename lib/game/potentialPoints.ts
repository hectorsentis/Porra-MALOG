import { defaultRules } from "./rules";

export function estimatePotentialPoints(openMatches: number, openGroupBets: number, openBonusMarkets: number): number {
  return (
    openMatches * (defaultRules.exactScore + defaultRules.qualifiedTeam + defaultRules.exactCrossing) +
    openGroupBets * (defaultRules.groupQualified + defaultRules.groupExactPosition) +
    openBonusMarkets * defaultRules.champion
  );
}
