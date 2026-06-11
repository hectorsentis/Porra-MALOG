export const defaultRules = {
  exactScore: 5,
  correctGoalDiff: 3,
  correctSign: 2,
  qualifiedTeam: 7,
  exactCrossing: 4,
  spainMultiplier: 2,
  groupQualified: 3,
  groupExactPosition: 2,
  koR32Qualified: 5,
  koR16Qualified: 7,
  koQfQualified: 8,
  koSfQualified: 10,
  koChampion: 15,
  koThirdPlace: 5,
  champion: 15,
  runnerUp: 10,
  semifinalist: 5,
  topScorer: 8,
  teamMostGoalsFor: 5,
  teamMostGoalsAgainst: 5,
  teamLeastGoalsFor: 5,
  teamLeastGoalsAgainst: 5,
  revelation: 5,
  disappointment: 5,
  totalGoals: 5,
  totalGoalsClose10: 3,
  totalGoalsClose20: 1,
  totalGoalsTolerance: 10
} as const;

export type GameRules = { [K in keyof typeof defaultRules]: number };

export const spainTeamIds = new Set(["ESP", "ES", "SPAIN", "ESPANA", "ESPAÑA"]);
