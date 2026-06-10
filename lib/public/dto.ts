export type PublicClassificationRow = {
  slug: string;
  alias: string;
  departamento: string | null;
  rango: string | null;
  pos: number;
  deltaPos: number;
  deltaPoints: number;
  pointsTotal: number;
  pointsMatches: number;
  pointsGroups: number;
  pointsEliminatorias: number;
  pointsBonus: number;
};

export type PublicDashboardData = {
  leader: PublicClassificationRow | null;
  distanceToSecond: number | null;
  participantsCount: number;
  distributedPoints: number;
  computedMatches: number;
  lastUpdatedAt: string | null;
  ranking: PublicClassificationRow[];
  departmentAverages: Array<{ departamento: string; averagePoints: number; participants: number }>;
  composition: Array<{ name: string; value: number }>;
};

export type PublicParticipantProfile = PublicClassificationRow & {
  participantId: string;
  betsCount: number;
  exactScores: number;
  correctSigns: number;
};
