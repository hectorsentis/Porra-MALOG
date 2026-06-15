export const API_FOOTBALL_DAILY_LIMIT = 100;
export const API_FOOTBALL_SAFETY_RESERVE = 10;
export const LIVE_POLL_INTERVAL_SEC = 300;
export const MAX_MATCH_DURATION_MIN = 130;
export const SAFETY_BUFFER_MIN = 80;
export const LIVE_ACTIVATION_THROTTLE_SEC = 20;

export const API_FOOTBALL_FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
export const API_FOOTBALL_LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P"]);

export const API_FOOTBALL_STATUS_LABELS: Record<string, string> = {
  "1H": "1ª parte",
  HT: "Descanso",
  "2H": "2ª parte",
  ET: "Prórroga",
  BT: "Descanso prórroga",
  P: "Penaltis",
  FT: "Finalizado",
  AET: "Finalizado",
  PEN: "Finalizado"
};
