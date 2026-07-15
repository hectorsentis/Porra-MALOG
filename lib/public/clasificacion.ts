
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { getEstDayKey, getMatchMadridDayKey, getMadridTodayKey } from "@/lib/utils/timezone";
import { API_FOOTBALL_STATUS_LABELS } from "@/lib/api-football/constants";
import { toPublicClassificationRow } from "./mappers";
import type { PublicClassificationRow } from "./dto";
import type { PublicFilters } from "./filters";
import { RANKING_CACHE_REVALIDATE_SECONDS, RANKING_CACHE_TAG, reviveDate } from "./cache";
import { getLiveProvisionalOverlay } from "./liveOverlay";

function includes(value: string | null | undefined, filter: string | undefined) {
  if (!filter) return true;
  return (value ?? "").toLocaleLowerCase("es-ES").includes(filter.toLocaleLowerCase("es-ES"));
}

function formatDayKeyEsLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-");
  return `${day}/${month}/${year}`;
}

export type LastMatchInfo = {
  tipo: "Exacto" | "Ganador" | "Fallo";
  label: string;
  resultado: string | null;
  apostado: string | null;
  points: number;
};

export type ClassificationOverviewRow = PublicClassificationRow & {
  matchesCount: number;
  exactScores: number;
  ganadores: number;
  fallos: number;
  pctAcierto: number;
  pointsToday: number;
  provisionalPoints: number;
  provisionalPointsToday: number;
  lastMatch: LastMatchInfo | null;
  racha: number;
};

export type LiveMatchInfo = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  resultText: string | null;
  statusLabel: string | null;
};

export type ClassificationOverview = {
  rows: ClassificationOverviewRow[];
  currentPhaseGroup: string | null;
  dayBaselineLabel: string;
  matchesToday: number;
  draftMatchesCount: number;
  liveMatch: LiveMatchInfo | null;
  topDayGainer: { alias: string; deltaPosDay: number } | null;
  topPhaseGainer: { alias: string; deltaPosPhase: number } | null;
};

/**
 * Official-results-only data. None of this depends on live/in-progress match
 * state, so it's safe to cache and invalidate only via revalidateTag(RANKING_CACHE_TAG)
 * from recalculateAll() — never on every live score change.
 */
const getCachedClassificationBase = unstable_cache(
  async () => {
    const generalRanking = await prisma.generalRanking.findMany({
      orderBy: { pos: "asc" },
      include: { participant: { select: { slug: true, alias: true, departamento: true, rango: true } } }
    });
    const matchCounts = await prisma.scoringMatch.groupBy({ by: ["participantId"], _count: { _all: true } });
    const scoringRows = await prisma.scoringMatch.findMany({
      where: { match: { fecha: { not: null } } },
      select: {
        participantId: true,
        pointsTotal: true,
        exactOk: true,
        signOk: true,
        betId: true,
        match: {
          select: { fecha: true, matchNo: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true, homeGoals: true, awayGoals: true, status: true }
        }
      },
      orderBy: [{ match: { fecha: "desc" } }, { match: { matchNo: "desc" } }]
    });
    const phaseSnapshot = await prisma.rankingSnapshot.findFirst({
      where: { trigger: "phase-start" },
      orderBy: { createdAt: "desc" },
      select: { phaseGroup: true }
    });
    const officialMatches = await prisma.match.findMany({
      where: { status: "OFFICIAL", finished: true, fecha: { not: null } },
      select: { fecha: true }
    });
    const draftMatchesCount = await prisma.match.count({ where: { status: "DRAFT" } });

    const scoringByParticipant = new Map<string, typeof scoringRows>();
    for (const row of scoringRows) {
      const list = scoringByParticipant.get(row.participantId) ?? [];
      list.push(row);
      scoringByParticipant.set(row.participantId, list);
    }
    const lastBetIds = [...scoringByParticipant.values()]
      .map((rows) => rows[0]?.betId)
      .filter((betId): betId is string => Boolean(betId));
    const lastBets = lastBetIds.length
      ? await prisma.betMatch.findMany({
          where: { betId: { in: lastBetIds } },
          select: { betId: true, predHomeGoals: true, predAwayGoals: true }
        })
      : [];

    return {
      generalRanking,
      matchCounts,
      scoringRows,
      phaseSnapshot,
      officialMatches,
      draftMatchesCount,
      lastBets
    };
  },
  [RANKING_CACHE_TAG, "classification-base"],
  { revalidate: RANKING_CACHE_REVALIDATE_SECONDS, tags: [RANKING_CACHE_TAG] }
);

/**
 * The "day-start" snapshot is created by recalculateAll() the first time it
 * runs on a given (EST) calendar day, capturing ranking positions as they
 * were right before that day's first change — exactly the baseline needed
 * for "Δ dia". Querying it directly (instead of trying to reconstruct a day
 * boundary from the match-event log, which is ordered by kickoff time and
 * can include results entered late/out of order) is what recalculateAll
 * itself uses for the persisted `deltaPosDay` field, so this keeps both in
 * sync.
 */
const getCachedDayStartSnapshot = unstable_cache(
  async (dayKey: string) =>
    prisma.rankingSnapshot.findFirst({
      where: { trigger: "day-start", dayKey },
      select: { dayKey: true, rows: { select: { participantId: true, pos: true } } }
    }),
  [RANKING_CACHE_TAG, "day-start-snapshot"],
  { revalidate: RANKING_CACHE_REVALIDATE_SECONDS, tags: [RANKING_CACHE_TAG] }
);

export async function getClassificationOverview(filters: PublicFilters = {}): Promise<ClassificationOverview> {
  // Compute today's date in Madrid timezone OUTSIDE the cache so it always reflects
  // the actual calendar day, not the day of the most recently scored match.
  const madridTodayKey = getMadridTodayKey();

  // recalculateAll() keys its "day-start" snapshot by EST day (see lib/game/recalculateAll.ts),
  // so the baseline lookup has to use the same day key to actually find it.
  const dayStartKey = getEstDayKey();

  const cached = await getCachedClassificationBase();
  const liveMatchRow = await prisma.match.findFirst({
    where: { status: "DRAFT" },
    select: {
      matchId: true,
      homeTeam: true,
      awayTeam: true,
      homeTeamId: true,
      awayTeamId: true,
      resultText: true,
      apiFootballSync: { select: { lastStatus: true } }
    }
  });
  const provisionalOverlay = await getLiveProvisionalOverlay();
  const dayStartSnapshot = await getCachedDayStartSnapshot(dayStartKey);
  const {
    generalRanking,
    matchCounts,
    scoringRows,
    phaseSnapshot,
    officialMatches,
    draftMatchesCount,
    lastBets
  } = cached;

  // "currentDayKey" = today's Madrid date, used for "played today" stats below
  // (independent of the EST-based day-start baseline used for Δ dia).
  const currentDayKey = madridTodayKey;

  // Revive Date fields — unstable_cache serializes them to strings on a cache hit.
  for (const row of scoringRows) {
    if (row.match.fecha) row.match.fecha = reviveDate(row.match.fecha);
  }
  for (const match of officialMatches) {
    if (match.fecha) match.fecha = reviveDate(match.fecha);
  }

  const liveMatch: LiveMatchInfo | null = liveMatchRow
    ? {
        matchId: liveMatchRow.matchId,
        homeTeam: formatCountry(liveMatchRow.homeTeamId, liveMatchRow.homeTeam ?? liveMatchRow.homeTeamId ?? ""),
        awayTeam: formatCountry(liveMatchRow.awayTeamId, liveMatchRow.awayTeam ?? liveMatchRow.awayTeamId ?? ""),
        resultText: liveMatchRow.resultText,
        statusLabel: liveMatchRow.apiFootballSync?.lastStatus
          ? API_FOOTBALL_STATUS_LABELS[liveMatchRow.apiFootballSync.lastStatus] ?? liveMatchRow.apiFootballSync.lastStatus
          : null
      }
    : null;

  const previousDayPosByParticipant = dayStartSnapshot ? new Map(dayStartSnapshot.rows.map((row) => [row.participantId, row.pos])) : null;

  // Label as "yesterday" in Madrid terms (the day-start snapshot is keyed by
  // EST internally, but this is just user-facing wording).
  const yesterdayMadrid = new Date(`${madridTodayKey}T00:00:00.000Z`);
  yesterdayMadrid.setUTCDate(yesterdayMadrid.getUTCDate() - 1);
  const dayBaselineLabel = dayStartSnapshot ? `el cierre del ${formatDayKeyEsLabel(yesterdayMadrid.toISOString().slice(0, 10))}` : "—";

  const matchesCountByParticipant = new Map(matchCounts.map((entry) => [entry.participantId, entry._count._all]));

  const scoringByParticipant = new Map<string, typeof scoringRows>();
  for (const row of scoringRows) {
    const list = scoringByParticipant.get(row.participantId) ?? [];
    list.push(row);
    scoringByParticipant.set(row.participantId, list);
  }

  const pointsTodayByParticipant = new Map<string, number>();
  for (const row of scoringRows) {
    const isToday = Boolean(row.match.fecha && currentDayKey != null && getMatchMadridDayKey(row.match.fecha) === currentDayKey);
    if (isToday) {
      pointsTodayByParticipant.set(row.participantId, (pointsTodayByParticipant.get(row.participantId) ?? 0) + row.pointsTotal);
    }
  }

  const lastBetByBetId = new Map(lastBets.map((bet) => [bet.betId!, bet]));

  const rows: ClassificationOverviewRow[] = generalRanking
    .map((row) => {
      const base = toPublicClassificationRow(row);
      if (!includes(base.alias, filters.alias) || !includes(base.departamento, filters.departamento) || !includes(base.rango, filters.rango)) return null;

      const matchesCount = matchesCountByParticipant.get(row.participantId) ?? 0;
      const ganadores = row.correctSigns - row.exactScores;
      const fallos = matchesCount - row.correctSigns;
      const pctAcierto = matchesCount ? row.correctSigns / matchesCount : 0;

      const participantScores = scoringByParticipant.get(row.participantId) ?? [];
      const first = participantScores[0] ?? null;
      let racha = 0;
      for (const score of participantScores) {
        if (score.pointsTotal > 0) racha += 1;
        else break;
      }

      let lastMatch: LastMatchInfo | null = null;
      if (first) {
        const homeLabel = formatCountry(first.match.homeTeamId, first.match.homeTeam);
        const awayLabel = formatCountry(first.match.awayTeamId, first.match.awayTeam);
        const bet = first.betId ? lastBetByBetId.get(first.betId) : undefined;
        lastMatch = {
          tipo: first.exactOk ? "Exacto" : first.signOk ? "Ganador" : "Fallo",
          label: `${homeLabel} - ${awayLabel}`,
          resultado: first.match.homeGoals != null && first.match.awayGoals != null ? `${first.match.homeGoals}-${first.match.awayGoals}` : null,
          apostado: bet?.predHomeGoals != null && bet?.predAwayGoals != null ? `${bet.predHomeGoals}-${bet.predAwayGoals}` : null,
          points: first.pointsTotal
        };
      }

      const previousDayPos = previousDayPosByParticipant?.get(row.participantId);
      const deltaPosDay = previousDayPos != null ? previousDayPos - row.pos : null;

      const provisionalDelta = provisionalOverlay.get(row.participantId)?.pointsDelta ?? 0;

      return {
        ...base,
        pointsTotal: base.pointsTotal + provisionalDelta,
        pointsMatches: base.pointsMatches + provisionalDelta,
        deltaPosDay,
        matchesCount,
        exactScores: row.exactScores,
        ganadores,
        fallos,
        pctAcierto,
        pointsToday: (pointsTodayByParticipant.get(row.participantId) ?? 0) + provisionalDelta,
        provisionalPoints: provisionalDelta,
        provisionalPointsToday: provisionalDelta,
        lastMatch,
        racha
      };
    })
    .filter((row): row is ClassificationOverviewRow => row != null);

  const matchesToday = currentDayKey == null ? 0 : officialMatches.filter((match) => match.fecha && getMatchMadridDayKey(match.fecha) === currentDayKey).length;

  const topDayGainer = rows.reduce<{ alias: string; deltaPosDay: number } | null>((top, row) => {
    if (row.deltaPosDay != null && row.deltaPosDay > 0 && (!top || row.deltaPosDay > top.deltaPosDay)) {
      return { alias: row.alias, deltaPosDay: row.deltaPosDay };
    }
    return top;
  }, null);

  const topPhaseGainer = rows.reduce<{ alias: string; deltaPosPhase: number } | null>((top, row) => {
    if (row.deltaPosPhase != null && row.deltaPosPhase > 0 && (!top || row.deltaPosPhase > top.deltaPosPhase)) {
      return { alias: row.alias, deltaPosPhase: row.deltaPosPhase };
    }
    return top;
  }, null);

  return {
    rows,
    currentPhaseGroup: phaseSnapshot?.phaseGroup ?? null,
    dayBaselineLabel,
    matchesToday,
    draftMatchesCount,
    liveMatch,
    topDayGainer,
    topPhaseGainer
  };
}
