import { prisma } from "@/lib/prisma";
import { countryByCode, formatCountry } from "@/lib/countries";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { getMatchKickoffUtc } from "@/lib/utils/timezone";
import {
  fetchApiFootballFixturesByIds,
  fetchApiFootballScheduledFixtures,
  fetchApiFootballWorldCupFixturesByDate,
  fetchApiFootballWorldCupLiveByLeague,
  fetchApiFootballWorldCupLiveFromAll,
  madridDateKey,
  type ApiFootballFixtureResponse
} from "./client";
import { canMakeApiFootballCall, recordApiFootballCall } from "./budget";
import { applyFixtureResult } from "./applyFixtureResult";
import { API_FOOTBALL_FINISHED_STATUSES } from "./constants";

type ApiFixture = ApiFootballFixtureResponse["fixtures"][number];

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleUpperCase("es-ES")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\bGERMANY\b/g, "ALEMANIA")
    .replace(/\bDEUTSCHLAND\b/g, "ALEMANIA")
    .replace(/\bCURACAO\b/g, "CURACAO")
    .replace(/\bCURAZAO\b/g, "CURACAO")
    .replace(/\bUNITED STATES\b/g, "USA")
    .replace(/\bCOTE D IVOIRE\b/g, "IVORY COAST")
    .trim();
}

function sameTeam(left: string | null | undefined, right: string | null | undefined) {
  const a = normalize(left);
  const b = normalize(right);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function dayDistance(local: Date | null, apiDate: string | null) {
  if (!local || !apiDate) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(apiDate);
  if (Number.isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER;
  return Math.abs(local.getTime() - parsed.getTime());
}

function bestFixtureForMatch(match: { kickoffTime: Date | null; fecha: Date | null; homeTeam: string | null; awayTeam: string | null; homeTeamId: string | null; awayTeamId: string | null }, fixtures: ApiFixture[]) {
  // API-Football returns FIFA/English team names, while formatCountry() returns
  // the Spanish display name — match against fifaName when available.
  const home = countryByCode(match.homeTeamId)?.fifaName ?? formatCountry(match.homeTeamId, match.homeTeam ?? match.homeTeamId ?? "");
  const away = countryByCode(match.awayTeamId)?.fifaName ?? formatCountry(match.awayTeamId, match.awayTeam ?? match.awayTeamId ?? "");
  const candidates = fixtures.filter((fixture) =>
    sameTeam(fixture.homeName, home) &&
    sameTeam(fixture.awayName, away)
  );
  if (candidates.length === 0) return null;
  const referenceDate = match.kickoffTime ?? match.fecha;
  return [...candidates].sort((a, b) => dayDistance(referenceDate, a.date) - dayDistance(referenceDate, b.date))[0] ?? null;
}

const MAX_EXTRA_DATE_CALLS = 5;

export async function syncApiFootballMatchIds() {
  const now = new Date();
  const calls: ApiFootballFixtureResponse[] = [];
  const first = await fetchApiFootballWorldCupLiveByLeague();
  calls.push(first);
  await recordApiFootballCall({ endpoint: first.endpoint, statusCode: first.statusCode });

  if (first.fixtures.length === 0) {
    const fallback = await fetchApiFootballWorldCupLiveFromAll();
    calls.push(fallback);
    await recordApiFootballCall({ endpoint: fallback.endpoint, statusCode: fallback.statusCode });
  }

  const fetchedDateKeys = new Set<string>();
  const todayKey = madridDateKey(now);

  if (calls.every((call) => call.fixtures.length === 0)) {
    const today = await fetchApiFootballScheduledFixtures(todayKey);
    calls.push(today);
    fetchedDateKeys.add(todayKey);
    await recordApiFootballCall({ endpoint: today.endpoint, statusCode: today.statusCode });
  }

  const matches = await prisma.match.findMany({
    where: {
      homeTeamId: { not: null },
      awayTeamId: { not: null }
    },
    select: {
      matchId: true,
      matchNo: true,
      fase: true,
      kickoffTime: true,
      fecha: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: true,
      awayTeam: true,
      apiFootballId: true,
      status: true,
      hora: true,
      apiFootballSync: { select: { apiMatchId: true } }
    },
    orderBy: [{ matchNo: "asc" }]
  });

  // Matches whose kickoff already passed but were never linked (e.g. the live
  // endpoints missed them because they weren't "live" when those calls ran).
  // Fetch their kickoff date(s) by date so they can be matched below.
  const pendingDateKeys = new Set<string>();
  for (const match of matches) {
    if (match.status === "OFFICIAL") continue;
    if (match.apiFootballId != null) continue;
    if (!match.kickoffTime || match.kickoffTime > now) continue;
    const key = madridDateKey(match.kickoffTime);
    if (!fetchedDateKeys.has(key)) pendingDateKeys.add(key);
  }

  for (const dateKey of [...pendingDateKeys].sort().reverse().slice(0, MAX_EXTRA_DATE_CALLS)) {
    if (!(await canMakeApiFootballCall())) break;
    const byDate = await fetchApiFootballWorldCupFixturesByDate(dateKey);
    calls.push(byDate);
    fetchedDateKeys.add(dateKey);
    await recordApiFootballCall({ endpoint: byDate.endpoint, statusCode: byDate.statusCode });
  }

  const apiFixtures = calls.flatMap((call) => call.fixtures);

  let created = 0;
  let updated = 0;
  const unmatched: Array<{ matchId: string; homeTeam: string; awayTeam: string }> = [];

  for (const match of matches) {
    const fixture = bestFixtureForMatch(match, apiFixtures);
    if (!fixture) {
      unmatched.push({
        matchId: match.matchId,
        homeTeam: formatCountry(match.homeTeamId, match.homeTeam ?? match.homeTeamId ?? ""),
        awayTeam: formatCountry(match.awayTeamId, match.awayTeam ?? match.awayTeamId ?? "")
      });
      continue;
    }
    const realKickoff = fixture.date ? new Date(fixture.date) : null;
    const kickoffTime =
      realKickoff && !Number.isNaN(realKickoff.getTime()) ? realKickoff : match.kickoffTime;
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { matchId: match.matchId },
        data: { apiFootballId: fixture.apiMatchId, kickoffTime }
      });
      await tx.apiFootballSync.upsert({
        where: { matchId: match.matchId },
        update: { apiMatchId: fixture.apiMatchId, competition: fixture.leagueName ?? "FIFA World Cup 2026", lastError: null },
        create: { matchId: match.matchId, apiMatchId: fixture.apiMatchId, competition: fixture.leagueName ?? "FIFA World Cup 2026" }
      });
    });
    if (match.apiFootballSync || match.apiFootballId) updated += 1;
    else created += 1;
  }

  // For unlinked matches with a known hora, pre-compute kickoffTime so
  // ensureLiveMatchesActive can activate them at the right moment even when
  // API-Football hasn't provided a fixture yet.
  const kickoffUpdates: Promise<unknown>[] = [];
  for (const match of matches) {
    if (match.apiFootballId != null) continue;
    if (!match.fecha || !match.hora) continue;
    const horaKickoff = getMatchKickoffUtc(match.fecha, match.hora);
    if (Number.isNaN(horaKickoff.getTime())) continue;
    if (!match.kickoffTime || Math.abs(horaKickoff.getTime() - match.kickoffTime.getTime()) > 60_000) {
      kickoffUpdates.push(prisma.match.update({ where: { matchId: match.matchId }, data: { kickoffTime: horaKickoff } }));
    }
  }
  await Promise.all(kickoffUpdates);
  const kickoffPrecomputed = kickoffUpdates.length;

  const finalized = await finalizeStaleMatches();

  return {
    endpoints: calls.map((call) => ({ endpoint: call.endpoint, results: call.log.results, returned: call.log.returned })),
    apiFixtures: apiFixtures.length,
    localMatches: matches.length,
    created,
    updated,
    kickoffPrecomputed,
    unmatched: unmatched.slice(0, 20),
    unmatchedCount: unmatched.length,
    finalized
  };
}

/** Called from the live-poll when a DRAFT match has no apiFootballId yet.
 *  Queries the live feeds (no date-based calls) and links any match found.
 *  Returns the list of newly linked matchIds. */
export async function tryLinkLiveDraftMatches(): Promise<string[]> {
  const unlinked = await prisma.match.findMany({
    where: { status: "DRAFT", apiFootballId: null, homeTeamId: { not: null }, awayTeamId: { not: null } },
    select: {
      matchId: true, kickoffTime: true, fecha: true, hora: true,
      homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true
    }
  });

  if (unlinked.length === 0 || !(await canMakeApiFootballCall())) return [];

  const first = await fetchApiFootballWorldCupLiveByLeague();
  await recordApiFootballCall({ endpoint: first.endpoint, statusCode: first.statusCode });

  let liveFixtures = first.fixtures;
  if (liveFixtures.length === 0 && (await canMakeApiFootballCall())) {
    const fallback = await fetchApiFootballWorldCupLiveFromAll();
    await recordApiFootballCall({ endpoint: fallback.endpoint, statusCode: fallback.statusCode });
    liveFixtures = fallback.fixtures;
  }

  if (liveFixtures.length === 0) return [];

  const linked: string[] = [];
  for (const match of unlinked) {
    const fixture = bestFixtureForMatch(match, liveFixtures);
    if (!fixture) continue;
    const realKickoff = fixture.date ? new Date(fixture.date) : null;
    const kickoffTime = realKickoff && !Number.isNaN(realKickoff.getTime()) ? realKickoff : match.kickoffTime;
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { matchId: match.matchId },
        data: { apiFootballId: fixture.apiMatchId, kickoffTime }
      });
      await tx.apiFootballSync.upsert({
        where: { matchId: match.matchId },
        update: { apiMatchId: fixture.apiMatchId, competition: fixture.leagueName ?? "FIFA World Cup 2026", isPollingActive: true, lastError: null },
        create: { matchId: match.matchId, apiMatchId: fixture.apiMatchId, competition: fixture.leagueName ?? "FIFA World Cup 2026", isPollingActive: true }
      });
    });
    linked.push(match.matchId);
  }

  return linked;
}

async function finalizeStaleMatches(now = new Date()): Promise<string[]> {
  const stale = await prisma.apiFootballSync.findMany({
    where: {
      match: {
        status: { not: "OFFICIAL" },
        kickoffTime: { lt: now }
      }
    },
    include: {
      match: {
        select: {
          matchId: true,
          matchNo: true,
          fase: true,
          jornadaId: true,
          homeTeamId: true,
          awayTeamId: true,
          homeGoals: true,
          awayGoals: true,
          homePens: true,
          awayPens: true,
          status: true
        }
      }
    }
  });

  if (stale.length === 0 || !(await canMakeApiFootballCall())) {
    return [];
  }

  const api = await fetchApiFootballFixturesByIds(stale.map((sync) => sync.apiMatchId));

  const fixtureByApiId = new Map(api.fixtures.map((fixture) => [fixture.apiMatchId, fixture]));
  const finalized: string[] = [];

  for (const sync of stale) {
    const fixture = fixtureByApiId.get(sync.apiMatchId);
    if (!fixture || fixture.status == null || !API_FOOTBALL_FINISHED_STATUSES.has(fixture.status)) continue;

    const { changed, isFinished } = await applyFixtureResult(sync, fixture, now, "api-football-sync");
    if (!changed || !isFinished) continue;

    await recalculateAll(prisma, {
      trigger: "official-result",
      matchId: sync.matchId,
      createdBy: "api-football-sync"
    });
    finalized.push(sync.matchId);
  }

  return finalized;
}
