export const defaultRules = {
  exactScore: 10,
  correctGoalDiff: 5,
  correctSign: 2,
  qualifiedTeam: 3,
  exactCrossing: 2,
  spainMultiplier: 2,
  groupQualified: 2,
  groupExactPosition: 3,
  champion: 15,
  runnerUp: 10,
  semifinalist: 4,
  topScorer: 6,
  teamMostGoalsFor: 5,
  teamMostGoalsAgainst: 5,
  teamLeastGoalsFor: 5,
  teamLeastGoalsAgainst: 5,
  revelation: 5,
  disappointment: 5,
  totalGoals: 8,
  totalGoalsTolerance: 10
} as const;

export type GameRules = typeof defaultRules;

export const spainTeamIds = new Set(["ESP", "ES", "SPAIN", "ESPANA", "ESPANA"]);

