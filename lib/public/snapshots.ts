import { prisma } from "@/lib/prisma";
import { getMatchMadridDayKey, getMatchKickoffUtc } from "@/lib/utils/timezone";

export type MatchEventSnapshot = {
  snapshotId: string;
  matchId: string;
  fecha: Date;
  matchNo: number | null;
  isLatest: boolean;
  dayKey: string;
};

export async function getMatchEventSnapshots(): Promise<MatchEventSnapshot[]> {
  const [snapshots, matches] = await Promise.all([
    prisma.rankingSnapshot.findMany({
      where: { trigger: null, matchId: { not: null } },
      select: { id: true, matchId: true, isLatest: true, createdAt: true }
    }),
    prisma.match.findMany({
      where: { fecha: { not: null } },
      select: { matchId: true, fecha: true, hora: true, matchNo: true }
    })
  ]);

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
}
