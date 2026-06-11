export function isOfficialMatchForScoring(match: {
  status?: string | null;
  finished?: boolean | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
}) {
  return match.status === "OFFICIAL" && match.finished === true && match.homeGoals != null && match.awayGoals != null;
}
