// football-data.org free tier: 10 calls per minute
export const FOOTBALL_DATA_RATE_LIMIT_PER_MIN = 10;
export const FOOTBALL_DATA_SAFETY_BUFFER = 2;

// Aliases kept so existing imports (budget.ts) don't break
export const API_FOOTBALL_DAILY_LIMIT = FOOTBALL_DATA_RATE_LIMIT_PER_MIN;
export const API_FOOTBALL_SAFETY_RESERVE = FOOTBALL_DATA_SAFETY_BUFFER;

export const LIVE_POLL_INTERVAL_SEC = 300;
export const MAX_MATCH_DURATION_MIN = 130;
export const SAFETY_BUFFER_MIN = 80;
export const LIVE_ACTIVATION_THROTTLE_SEC = 20;

export const API_FOOTBALL_FINISHED_STATUSES = new Set(["FINISHED"]);
export const API_FOOTBALL_LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED"]);

export const API_FOOTBALL_STATUS_LABELS: Record<string, string> = {
  IN_PLAY: "En juego",
  PAUSED: "Descanso",
  FINISHED: "Finalizado",
  SCHEDULED: "Programado",
  TIMED: "Programado",
  POSTPONED: "Aplazado",
  SUSPENDED: "Suspendido",
  CANCELLED: "Cancelado"
};
