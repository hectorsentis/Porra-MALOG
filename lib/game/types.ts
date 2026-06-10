export type MatchSign = "1" | "X" | "2";

export type MatchBetInput = {
  betId?: string | null;
  participantId: string;
  matchId: string;
  fase?: string | null;
  predHomeTeamId?: string | null;
  predAwayTeamId?: string | null;
  predHomeGoals?: number | null;
  predAwayGoals?: number | null;
  predQualifiedTeamId?: string | null;
};

export type MatchResultInput = {
  matchId: string;
  fase?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  qualifiedTeamId?: string | null;
  finished?: boolean;
};

export type MatchScore = {
  betId?: string | null;
  participantId: string;
  matchId: string;
  fase?: string | null;
  predSign: MatchSign | null;
  predGoalDiff: number | null;
  realSign: MatchSign | null;
  realGoalDiff: number | null;
  exactOk: boolean;
  diffOk: boolean;
  signOk: boolean;
  qualifiedOk: boolean;
  cruceExactoOk: boolean;
  spainMatch: boolean;
  multiplier: number;
  pointsResult: number;
  pointsQualified: number;
  pointsCruceExacto: number;
  pointsTotal: number;
};

export type GroupBetInput = {
  groupBetId?: string | null;
  participantId: string;
  grupo: string;
  predPos: number;
  predTeamId?: string | null;
  valid?: boolean;
};

export type GroupStandingInput = {
  grupo: string;
  teamId: string;
  pos: number;
  status?: string | null;
};

export type GroupScore = {
  groupBetId?: string | null;
  participantId: string;
  grupo: string;
  predPos: number;
  predTeamId?: string | null;
  realPos: number | null;
  realStatus: string | null;
  qualifiedOk: boolean;
  exactPositionOk: boolean;
  pointsQualified: number;
  pointsPosition: number;
  pointsTotal: number;
};

export type BonusBetInput = {
  participantId: string;
  alias?: string | null;
  campeon?: string | null;
  subcampeon?: string | null;
  semifinalistas?: Array<string | null | undefined>;
  maximoGoleador?: string | null;
  seleccionMasGoleadora?: string | null;
  seleccionMasGoleada?: string | null;
  seleccionMenosGoleadora?: string | null;
  seleccionMenosGoleada?: string | null;
  equipoRevelacion?: string | null;
  equipoDecepcion?: string | null;
  totalGolesTorneo?: number | null;
};

export type BonusResultInput = {
  campeon?: string | null;
  subcampeon?: string | null;
  semifinalistas?: Array<string | null | undefined>;
  maximoGoleador?: string | null;
  seleccionMasGoleadora?: string | null;
  seleccionMasGoleada?: string | null;
  seleccionMenosGoleadora?: string | null;
  seleccionMenosGoleada?: string | null;
  equipoRevelacion?: string | null;
  equipoDecepcion?: string | null;
  totalGolesTorneo?: number | null;
};

export type BonusScore = {
  participantId: string;
  alias?: string | null;
  campeonOk: boolean;
  subcampeonOk: boolean;
  semifinalistasOk: number;
  maximoGoleadorOk: boolean;
  seleccionMasGoleadoraOk: boolean;
  seleccionMasGoleadaOk: boolean;
  seleccionMenosGoleadoraOk: boolean;
  seleccionMenosGoleadaOk: boolean;
  equipoRevelacionOk: boolean;
  equipoDecepcionOk: boolean;
  totalGolesTorneoOk: boolean;
  pointsTotal: number;
};

export type RankingInput = {
  participantId: string;
  alias: string;
  departamento?: string | null;
  rango?: string | null;
  pointsMatches?: number;
  pointsGroups?: number;
  pointsEliminatorias?: number;
  pointsBonus?: number;
  previousPos?: number | null;
  previousPoints?: number | null;
};

export type RankingRow = Required<Omit<RankingInput, "previousPos" | "previousPoints">> & {
  pos: number;
  pointsTotal: number;
  deltaPos: number;
  deltaPoints: number;
};

export type SimulationInput = {
  participants: RankingInput[];
  matchScores?: MatchScore[];
  groupScores?: GroupScore[];
  bonusScores?: BonusScore[];
};
