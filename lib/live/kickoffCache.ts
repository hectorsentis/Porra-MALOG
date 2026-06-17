import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MAX_MATCH_DURATION_MIN } from "@/lib/api-football/constants";

export const KICKOFF_CACHE_TAG = "kickoff-windows";
const PRE_ACTIVATION_BUFFER_MIN = 20;

export const getCachedKickoffWindows = unstable_cache(
  async () => {
    const matches = await prisma.match.findMany({
      where: { status: { notIn: ["OFFICIAL", "VOID", "SIMULATED"] }, kickoffTime: { not: null } },
      select: { matchId: true, kickoffTime: true }
    });
    return matches as { matchId: string; kickoffTime: Date }[];
  },
  [KICKOFF_CACHE_TAG],
  { revalidate: 300, tags: [KICKOFF_CACHE_TAG] }
);

/** Returns true if any non-OFFICIAL match has a kickoff within the active polling window. */
export function hasMatchInLiveWindow(kickoffs: { kickoffTime: Date }[], now: Date): boolean {
  const windowStart = new Date(now.getTime() - MAX_MATCH_DURATION_MIN * 60_000);
  const windowEnd = new Date(now.getTime() + PRE_ACTIVATION_BUFFER_MIN * 60_000);
  return kickoffs.some((m) => m.kickoffTime >= windowStart && m.kickoffTime <= windowEnd);
}
