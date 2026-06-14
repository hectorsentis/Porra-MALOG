import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { getMatchMadridDayKey } from "@/lib/utils/timezone";
import { getMatchEventSnapshots } from "./snapshots";
import { toPublicClassificationRow } from "./mappers";
import type { PublicClassificationRow } from "./dto";
import type { PublicFilters } from "./filters";

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
  lastMatch: LastMatchInfo | null;
  racha: number;
};

export type ClassificationOverview = {
  rows: ClassificationOverviewRow[];
  currentPhaseGroup: string | null;
  dayBaselineLabel: string;
  matchesToday: number;
  topDayGainer: { alias: string; deltaPosDay: number } | null;
  topPhaseGainer: { alias: string; deltaPosPhase: number } | null;
};

export async function getClassificationOverview(filters: PublicFilters = {}): Promise<ClassificationOverview> {
  noStore();

  const [generalRanking, matchCounts, scoringRows, phaseSnapshot, officialMatches, matchEvents] = await Promise.all([
    prisma.generalRanking.findMany({
      orderBy: { pos: "asc" },
      include: { participant: { select: { slug: true } } }
    }),
    prisma.scoringMatch.groupBy({ by: ["participantId"], _count: { _all: true } }),
    prisma.scoringMatch.findMany({
      where: { match: { fecha: { not: null } } },
      select: {
        participantId: true,
        pointsTotal: true,
        exactOk: true,
        signOk: true,
        betId: true,
        match: {
          select: { fecha: true, matchNo: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true, homeGoals: true, awayGoals: true }
        }
      },
      orderBy: [{ match: { fecha: "desc" } }, { match: { matchNo: "desc" } }]
    }),
    prisma.rankingSnapshot.findFirst({
      where: { trigger: "phase-start" },
      orderBy: { createdAt: "desc" },
      select: { phaseGroup: true }
    }),
    prisma.match.findMany({
      where: { status: "OFFICIAL", finished: true, fecha: { not: null } },
      select: { fecha: true }
    }),
    getMatchEventSnapshots()
  ]);

  const currentDayKey = matchEvents[0]?.dayKey ?? null;
  const previousDaySnapshot = matchEvents.find((event) => currentDayKey != null && event.dayKey !== currentDayKey) ?? null;

  const previousDayPosByParticipant = previousDaySnapshot
    ? new Map(
        (
          await prisma.rankingSnapshotRow.findMany({
            where: { snapshotId: previousDaySnapshot.snapshotId },
            select: { participantId: true, pos: true }
          })
        ).map((row) => [row.participantId, row.pos])
      )
    : null;

  const dayBaselineLabel = previousDaySnapshot
    ? `el cierre del ${formatDayKeyEsLabel(previousDaySnapshot.dayKey)}`
    : "—";

  const matchesCountByParticipant = new Map(matchCounts.map((entry) => [entry.participantId, entry._count._all]));

  const scoringByParticipant = new Map<string, typeof scoringRows>();
  for (const row of scoringRows) {
    const list = scoringByParticipant.get(row.participantId) ?? [];
    list.push(row);
    scoringByParticipant.set(row.participantId, list);
  }

  const pointsTodayByParticipant = new Map<string, number>();
  for (const row of scoringRows) {
    if (!row.match.fecha || currentDayKey == null || getMatchMadridDayKey(row.match.fecha) !== currentDayKey) continue;
    pointsTodayByParticipant.set(row.participantId, (pointsTodayByParticipant.get(row.participantId) ?? 0) + row.pointsTotal);
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

      return {
        ...base,
        deltaPosDay,
        matchesCount,
        exactScores: row.exactScores,
        ganadores,
        fallos,
        pctAcierto,
        pointsToday: pointsTodayByParticipant.get(row.participantId) ?? 0,
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
    topDayGainer,
    topPhaseGainer
  };
}
