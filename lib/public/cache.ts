/**
 * Shared cache tags/revalidate windows for the public ranking/classification
 * read paths. Individual `lib/public/*.ts` files wrap their own heavy Prisma
 * queries in `unstable_cache` using these constants, following the pattern
 * already established by `lib/live/kickoffCache.ts`.
 *
 * `RANKING_CACHE_TAG` covers anything derived from persisted, official-only
 * scoring data (`generalRanking`, `scoringMatch`, `rankingSnapshot`, ...).
 * It's invalidated via `revalidateTag` from `recalculateAll()` whenever a
 * match is finalized — never from live/in-play score changes, which are
 * computed on the fly instead of persisted (see `lib/public/liveOverlay.ts`).
 *
 * `LIVE_BETS_CACHE_TAG` covers the bet predictions for currently live
 * matches, used to compute the read-time provisional-points overlay. Bet
 * predictions don't change once a match starts, so this can use a longer
 * revalidate window than the ranking data itself.
 */
export const RANKING_CACHE_TAG = "ranking-data";
export const RANKING_CACHE_REVALIDATE_SECONDS = 300;

export const LIVE_BETS_CACHE_TAG = "live-bets";
export const LIVE_BETS_CACHE_REVALIDATE_SECONDS = 300;

/**
 * `unstable_cache` JSON-serializes its return value. On a cache MISS it hands
 * back the live in-memory result (real `Date` objects survive), but on a
 * cache HIT it returns the deserialized value, where every `Date` field has
 * become a plain ISO string. Any code that later calls `.toISOString()` or
 * other Date methods on a cached field must revive it first with this
 * helper, or it will throw intermittently once the cache warms up (this bit
 * production once already — see git history).
 */
export function reviveDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function reviveDateOrNull(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  return reviveDate(value);
}
