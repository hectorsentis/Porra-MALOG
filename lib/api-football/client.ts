import { canMakeApiFootballCall, recordApiFootballCall } from "./budget";

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    date?: string | null;
    status?: { short?: string | null };
  };
  league?: {
    id?: number | null;
    name?: string | null;
    season?: number | null;
  };
  teams?: {
    home?: { name?: string | null; winner?: boolean | null };
    away?: { name?: string | null; winner?: boolean | null };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    penalty?: { home?: number | null; away?: number | null };
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

function apiFootballEnv() {
  const numericEnv = (value: string | undefined, fallback: string) => {
    const match = (value ?? "").match(/\d+/);
    return match?.[0] ?? fallback;
  };
  return {
    baseUrl: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
    apiKey: process.env.API_FOOTBALL_KEY || "",
    leagueId: numericEnv(process.env.API_FOOTBALL_LEAGUE_ID, "1"),
    season: numericEnv(process.env.API_FOOTBALL_SEASON, "2026")
  };
}

function isWorldCupFixture(fixture: ApiFootballLiveFixture, env = apiFootballEnv()) {
  return fixture.leagueId === Number(env.leagueId) && fixture.season === Number(env.season);
}

function mapFixture(item: ApiFootballFixture): ApiFootballLiveFixture | null {
  const apiMatchId = item.fixture?.id;
  if (typeof apiMatchId !== "number") return null;
  return {
    apiMatchId,
    date: item.fixture?.date ?? null,
    status: item.fixture?.status?.short ?? null,
    leagueId: item.league?.id ?? null,
    leagueName: item.league?.name ?? null,
    season: item.league?.season ?? null,
    homeName: item.teams?.home?.name ?? null,
    awayName: item.teams?.away?.name ?? null,
    homeGoals: item.goals?.home ?? null,
    awayGoals: item.goals?.away ?? null,
    homePens: item.score?.penalty?.home ?? null,
    awayPens: item.score?.penalty?.away ?? null,
    homeWinner: item.teams?.home?.winner ?? null,
    awayWinner: item.teams?.away?.winner ?? null
  };
}

function logForCall(url: URL, statusCode: number, body: { errors?: unknown; results?: unknown }, fixtures: ApiFootballLiveFixture[]): ApiFootballCallLog {
  const params = Object.fromEntries(url.searchParams.entries());
  return {
    url: `${url.origin}${url.pathname}`,
    params,
    statusCode,
    errors: body.errors ?? null,
    results: body.results ?? fixtures.length,
    returned: fixtures.map((fixture) => ({
      fixtureId: fixture.apiMatchId,
      leagueId: fixture.leagueId,
      leagueSeason: fixture.season,
      home: fixture.homeName,
      away: fixture.awayName,
      status: fixture.status,
      goals: { home: fixture.homeGoals, away: fixture.awayGoals }
    }))
  };
}

async function requestFixtures(params: Record<string, string>, filterWorldCup: boolean): Promise<ApiFootballFixtureResponse> {
  const env = apiFootballEnv();
  if (!env.apiKey) throw new Error("API_FOOTBALL_KEY no configurada");

  const url = new URL("/fixtures", env.baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { "x-apisports-key": env.apiKey },
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({}));
  const rawFixtures = Array.isArray(body.response) ? (body.response as ApiFootballFixture[]) : [];
  const mapped = rawFixtures.map(mapFixture).filter((item): item is ApiFootballLiveFixture => item != null);
  const fixtures = filterWorldCup ? mapped.filter((fixture) => isWorldCupFixture(fixture, env)) : mapped;
  const log = logForCall(url, response.status, body, fixtures);

  if (process.env.API_FOOTBALL_DEBUG === "1") {
    console.info("[api-football]", JSON.stringify(log));
  }

  if (!response.ok) {
    throw new Error(`API-Football ${response.status}: ${JSON.stringify({ errors: body.errors, results: body.results }).slice(0, 300)}`);
  }

  return {
    endpoint: `/fixtures?${url.searchParams.toString()}`,
    statusCode: response.status,
    fixtures,
    log
  };
}

export function madridDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export async function fetchApiFootballWorldCupLiveByLeague() {
  const env = apiFootballEnv();
  return requestFixtures({ live: env.leagueId }, true);
}

export async function fetchApiFootballWorldCupLiveFromAll() {
  return requestFixtures({ live: "all" }, true);
}

export async function fetchApiFootballWorldCupFixturesByDate(dateKey = madridDateKey()) {
  // Free plans reject `league`+`season` combo queries ("Free plans do not have
  // access to this season"). Query by date only and filter to the World Cup
  // client-side via isWorldCupFixture (requestFixtures' filterWorldCup=true).
  return requestFixtures({ date: dateKey, timezone: "Europe/Madrid" }, true);
}

export async function fetchApiFootballFixturesByIds(apiMatchIds: number[]) {
  const uniqueIds = [...new Set(apiMatchIds)].filter(Number.isFinite);
  if (uniqueIds.length === 0) {
    return {
      endpoint: "/fixtures?ids=",
      statusCode: 200,
      fixtures: [],
      log: { url: "/fixtures", params: { ids: "" }, statusCode: 200, errors: null, results: 0, returned: [] }
    } satisfies ApiFootballFixtureResponse;
  }

  // Free plans reject the plural `ids` parameter ("Free plans do not have
  // access to the Ids parameter") — fetch one fixture at a time via `id=`,
  // which works for any season, and record each call against the budget.
  const results: ApiFootballFixtureResponse[] = [];
  for (const id of uniqueIds) {
    if (!(await canMakeApiFootballCall())) break;
    const single = await requestFixtures({ id: String(id) }, true);
    await recordApiFootballCall({ endpoint: single.endpoint, statusCode: single.statusCode });
    results.push(single);
  }

  const fixtures = results.flatMap((result) => result.fixtures);
  return {
    endpoint: `/fixtures?id=${uniqueIds.join(",")}`,
    statusCode: results.at(-1)?.statusCode ?? 200,
    fixtures,
    log: {
      url: "/fixtures",
      params: { id: uniqueIds.join(",") },
      statusCode: results.at(-1)?.statusCode ?? 200,
      errors: null,
      results: fixtures.length,
      returned: results.flatMap((result) => result.log.returned)
    }
  } satisfies ApiFootballFixtureResponse;
}

export async function fetchApiFootballLiveFixtures() {
  const first = await fetchApiFootballWorldCupLiveByLeague();
  if (first.fixtures.length > 0) return first;
  const fallback = await fetchApiFootballWorldCupLiveFromAll();
  return {
    ...fallback,
    log: {
      ...fallback.log,
      errors: { liveLeague: first.log.errors, liveAll: fallback.log.errors },
      results: { liveLeague: first.log.results, liveAll: fallback.log.results }
    }
  };
}

export async function fetchApiFootballScheduledFixtures(dateKey = madridDateKey()) {
  return fetchApiFootballWorldCupFixturesByDate(dateKey);
}
