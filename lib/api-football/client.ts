import { canMakeApiFootballCall, recordApiFootballCall } from "./budget";

// football-data.org v4 match shape (partial)
type FdMatch = {
  id?: number;
  utcDate?: string | null;
  status?: string | null;
  homeTeam?: { name?: string | null; shortName?: string | null };
  awayTeam?: { name?: string | null; shortName?: string | null };
  score?: {
    winner?: string | null;
    fullTime?: { home?: number | null; away?: number | null };
    extraTime?: { home?: number | null; away?: number | null };
    penalties?: { home?: number | null; away?: number | null };
  };
};

export type ApiFootballLiveFixture = {
  apiMatchId: number;
  date: string | null;
  status: string | null;
  leagueId: number | null;
  leagueName: string | null;
  season: number | null;
  homeName: string | null;
  awayName: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homePens: number | null;
  awayPens: number | null;
  homeWinner: boolean | null;
  awayWinner: boolean | null;
};

export type ApiFootballCallLog = {
  url: string;
  params: Record<string, string>;
  statusCode: number;
  errors: unknown;
  results: unknown;
  returned: Array<{
    fixtureId: number;
    leagueId: number | null;
    leagueSeason: number | null;
    home: string | null;
    away: string | null;
    status: string | null;
    goals: { home: number | null; away: number | null };
  }>;
};

export type ApiFootballFixtureResponse = {
  endpoint: string;
  statusCode: number;
  fixtures: ApiFootballLiveFixture[];
  log: ApiFootballCallLog;
};

const BASE_URL = "https://api.football-data.org/v4";
// FIFA World Cup competition ID on football-data.org
const WC_COMPETITION_ID = "2000";
const WC_LEAGUE_ID = 2000;
const WC_SEASON = 2026;

function fdKey(): string {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_KEY no configurada");
  return key;
}

function mapFdMatch(item: FdMatch): ApiFootballLiveFixture | null {
  const apiMatchId = item.id;
  if (typeof apiMatchId !== "number") return null;

  // fullTime is the live/regulation score; extraTime is the extra-period goals
  // (not cumulative), so add them when present.
  const ftHome = item.score?.fullTime?.home ?? null;
  const ftAway = item.score?.fullTime?.away ?? null;
  const etHome = item.score?.extraTime?.home ?? null;
  const etAway = item.score?.extraTime?.away ?? null;
  const homeGoals = etHome != null ? (ftHome ?? 0) + etHome : ftHome;
  const awayGoals = etAway != null ? (ftAway ?? 0) + etAway : ftAway;

  const winner = item.score?.winner ?? null;

  return {
    apiMatchId,
    date: item.utcDate ?? null,
    status: item.status ?? null,
    leagueId: WC_LEAGUE_ID,
    leagueName: "FIFA World Cup 2026",
    season: WC_SEASON,
    homeName: item.homeTeam?.name ?? null,
    awayName: item.awayTeam?.name ?? null,
    homeGoals,
    awayGoals,
    homePens: item.score?.penalties?.home ?? null,
    awayPens: item.score?.penalties?.away ?? null,
    homeWinner: winner === null ? null : winner === "HOME_TEAM",
    awayWinner: winner === null ? null : winner === "AWAY_TEAM"
  };
}

function buildLog(url: URL, statusCode: number, fixtures: ApiFootballLiveFixture[], error?: unknown): ApiFootballCallLog {
  return {
    url: `${url.origin}${url.pathname}`,
    params: Object.fromEntries(url.searchParams.entries()),
    statusCode,
    errors: error ?? null,
    results: fixtures.length,
    returned: fixtures.map((f) => ({
      fixtureId: f.apiMatchId,
      leagueId: f.leagueId,
      leagueSeason: f.season,
      home: f.homeName,
      away: f.awayName,
      status: f.status,
      goals: { home: f.homeGoals, away: f.awayGoals }
    }))
  };
}

async function requestCompetitionMatches(params: Record<string, string>): Promise<ApiFootballFixtureResponse> {
  const url = new URL(`/v4/competitions/${WC_COMPETITION_ID}/matches`, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const response = await fetch(url.toString(), {
    headers: { "X-Auth-Token": fdKey() },
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = (body as { message?: string; error?: string }).message ?? (body as { message?: string; error?: string }).error ?? JSON.stringify(body).slice(0, 200);
    throw new Error(`football-data.org ${response.status}: ${msg}`);
  }

  const rawMatches: FdMatch[] = Array.isArray((body as { matches?: FdMatch[] }).matches) ? (body as { matches: FdMatch[] }).matches : [];
  const fixtures = rawMatches.map(mapFdMatch).filter((f): f is ApiFootballLiveFixture => f !== null);
  const endpoint = `/competitions/${WC_COMPETITION_ID}/matches?${url.searchParams.toString()}`;
  const log = buildLog(url, response.status, fixtures);

  if (process.env.API_FOOTBALL_DEBUG === "1") {
    console.info("[football-data]", JSON.stringify({ endpoint, returned: log.returned.length, fixtures: log.returned }));
  }

  return { endpoint, statusCode: response.status, fixtures, log };
}

async function requestSingleMatch(apiMatchId: number): Promise<ApiFootballFixtureResponse> {
  const url = new URL(`/v4/matches/${apiMatchId}`, BASE_URL);

  const response = await fetch(url.toString(), {
    headers: { "X-Auth-Token": fdKey() },
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    // 404 = ID from old api-football provider; treat as "not found yet"
    if (response.status === 404) {
      return { endpoint: `/matches/${apiMatchId}`, statusCode: 404, fixtures: [], log: buildLog(url, 404, []) };
    }
    const msg = (body as { message?: string; error?: string }).message ?? (body as { message?: string; error?: string }).error ?? JSON.stringify(body).slice(0, 200);
    throw new Error(`football-data.org ${response.status}: ${msg}`);
  }

  // Single-match endpoint returns the match object directly (not in a .matches array)
  const fixture = mapFdMatch(body as FdMatch);
  const fixtures = fixture ? [fixture] : [];
  const endpoint = `/matches/${apiMatchId}`;
  const log = buildLog(url, response.status, fixtures);

  if (process.env.API_FOOTBALL_DEBUG === "1") {
    console.info("[football-data]", JSON.stringify({ endpoint, returned: log.returned.length }));
  }

  return { endpoint, statusCode: response.status, fixtures, log };
}

export function madridDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/** Live matches currently in play (1st or 2nd half). */
export async function fetchApiFootballWorldCupLiveByLeague(): Promise<ApiFootballFixtureResponse> {
  return requestCompetitionMatches({ status: "IN_PLAY" });
}

/** Matches at halftime — used as fallback when IN_PLAY returns nothing. */
export async function fetchApiFootballWorldCupLiveFromAll(): Promise<ApiFootballFixtureResponse> {
  return requestCompetitionMatches({ status: "PAUSED" });
}

/** All WC matches on a given Madrid calendar date. */
export async function fetchApiFootballWorldCupFixturesByDate(dateKey = madridDateKey()): Promise<ApiFootballFixtureResponse> {
  return requestCompetitionMatches({ dateFrom: dateKey, dateTo: dateKey });
}

export async function fetchApiFootballScheduledFixtures(dateKey = madridDateKey()): Promise<ApiFootballFixtureResponse> {
  return fetchApiFootballWorldCupFixturesByDate(dateKey);
}

/** Poll individual matches by their football-data.org match IDs. */
export async function fetchApiFootballFixturesByIds(apiMatchIds: number[]): Promise<ApiFootballFixtureResponse> {
  const uniqueIds = [...new Set(apiMatchIds)].filter(Number.isFinite);
  if (uniqueIds.length === 0) {
    return {
      endpoint: "/matches?ids=",
      statusCode: 200,
      fixtures: [],
      log: { url: `${BASE_URL}/matches`, params: {}, statusCode: 200, errors: null, results: 0, returned: [] }
    };
  }

  const results: ApiFootballFixtureResponse[] = [];
  for (const id of uniqueIds) {
    if (!(await canMakeApiFootballCall())) break;
    const single = await requestSingleMatch(id);
    await recordApiFootballCall({ endpoint: single.endpoint, statusCode: single.statusCode });
    results.push(single);
  }

  const fixtures = results.flatMap((r) => r.fixtures);
  return {
    endpoint: `/matches/${uniqueIds.join(",")}`,
    statusCode: results.at(-1)?.statusCode ?? 200,
    fixtures,
    log: {
      url: `${BASE_URL}/matches`,
      params: { ids: uniqueIds.join(",") },
      statusCode: results.at(-1)?.statusCode ?? 200,
      errors: null,
      results: fixtures.length,
      returned: results.flatMap((r) => r.log.returned)
    }
  };
}

export async function fetchApiFootballLiveFixtures(): Promise<ApiFootballFixtureResponse> {
  const first = await fetchApiFootballWorldCupLiveByLeague();
  if (first.fixtures.length > 0) return first;
  return fetchApiFootballWorldCupLiveFromAll();
}
