import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getMatchMadridDayKey, getMatchKickoffUtc } from "@/lib/utils/timezone";
import { RANKING_CACHE_REVALIDATE_SECONDS, RANKING_CACHE_TAG, reviveDate } from "./cache";

export type MatchEventSnapshot = {
  snapshotId: string;
  matchId: string;
  fecha: Date;
  matchNo: number | null;
  isLatest: boolean;
  dayKey: string;
};

const getCachedMatchEventSnapshots = unstable_cache(
  async (): Promise<MatchEventSnapshot[]> => {
  const snapshots = await prisma.rankingSnapshot.findMany({
    where: { trigger: null, matchId: { not: null } },
    select: { id: true, matchId: true, isLatest: true, createdAt: true }
  });
  const matches = await prisma.match.findMany({
    where: { fecha: { not: null } },
    select: { matchId: true, fecha: true, hora: true, matchNo: true }
  });

  const matchById = new Map(matches.map((match) => [match.matchId, match]));

  const latestSnapshotByMatchId = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (!snapshot.matchId) continue;
    const current = latestSnapshotByMatchId.get(snapshot.matchId);
    if (!current || snapshot.createdAt > current.createdAt) latestSnapshotByMatchId.set(snapshot.matchId, snapshot);
  }

  return [...latestSnapshotByMatchId.values()]
    .map((snapshot): MatchEventSnapshot | null => {
      const match = snapshot.matchId ? matchById.get(snapshot.matchId) : undefined;
      if (!match?.fecha) return null;
      return {
        snapshotId: snapshot.id,
        matchId: snapshot.matchId!,
        fecha: match.fecha,
        matchNo: match.matchNo,
        isLatest: snapshot.isLatest,
        dayKey: getMatchMadridDayKey(match.fecha)
      };
    })
    .filter((event): event is MatchEventSnapshot => event != null)
    .sort((a, b) => {
      const aMatch = matchById.get(a.matchId)!;
      const bMatch = matchById.get(b.matchId)!;
      return getMatchKickoffUtc(bMatch.fecha!, bMatch.hora).getTime() - getMatchKickoffUtc(aMatch.fecha!, aMatch.hora).getTime();
    });
  },
  [RANKING_CACHE_TAG, "match-event-snapshots"],
  { revalidate: RANKING_CACHE_REVALIDATE_SECONDS, tags: [RANKING_CACHE_TAG] }
);

/** Purely derived from persisted ranking snapshots/matches — cached like the rest of the official-only data. */
export async function getMatchEventSnapshots(): Promise<MatchEventSnapshot[]> {
  const events = await getCachedMatchEventSnapshots();
  // Revive `fecha` — unstable_cache serializes Dates to strings on a cache hit.
  return events.map((event) => ({ ...event, fecha: reviveDate(event.fecha) }));
}
