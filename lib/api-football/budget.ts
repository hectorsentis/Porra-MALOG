import { prisma } from "@/lib/prisma";
import { FOOTBALL_DATA_RATE_LIMIT_PER_MIN, FOOTBALL_DATA_SAFETY_BUFFER } from "./constants";

const RATE_WINDOW_MS = 60_000;

export async function getCallsUsedLastMinute() {
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  return prisma.apiCallLog.count({ where: { createdAt: { gte: since } } });
}

// Legacy alias used by some call sites that still pass a dayKey arg
export async function getCallsUsedToday(_dayKey?: string) {
  return getCallsUsedLastMinute();
}

export async function canMakeApiFootballCall(_dayKey?: string) {
  const used = await getCallsUsedLastMinute();
  return used < FOOTBALL_DATA_RATE_LIMIT_PER_MIN - FOOTBALL_DATA_SAFETY_BUFFER;
}

export async function recordApiFootballCall(args: { matchId?: string | null; endpoint: string; statusCode?: number | null; dayKey?: string }) {
  await prisma.apiCallLog.create({
    data: {
      dayKey: args.dayKey ?? new Date().toISOString().slice(0, 10),
      matchId: args.matchId ?? null,
      endpoint: args.endpoint,
      statusCode: args.statusCode ?? null
    }
  });
}

export async function getApiFootballBudget(_dayKey?: string) {
  const usedLastMinute = await getCallsUsedLastMinute();
  const limit = FOOTBALL_DATA_RATE_LIMIT_PER_MIN - FOOTBALL_DATA_SAFETY_BUFFER;
  return {
    source: "football-data.org",
    rateLimit: FOOTBALL_DATA_RATE_LIMIT_PER_MIN,
    safetyBuffer: FOOTBALL_DATA_SAFETY_BUFFER,
    usedLastMinute,
    remaining: Math.max(0, limit - usedLastMinute)
  };
}
