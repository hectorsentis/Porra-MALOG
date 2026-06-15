import { prisma } from "@/lib/prisma";
import { getEstDayKey } from "@/lib/utils/timezone";
import { API_FOOTBALL_DAILY_LIMIT, API_FOOTBALL_SAFETY_RESERVE } from "./constants";

export async function getCallsUsedToday(dayKey = getEstDayKey(new Date())) {
  return prisma.apiCallLog.count({ where: { dayKey } });
}

export async function canMakeApiFootballCall(dayKey = getEstDayKey(new Date())) {
  const used = await getCallsUsedToday(dayKey);
  return used < API_FOOTBALL_DAILY_LIMIT - API_FOOTBALL_SAFETY_RESERVE;
}

export async function recordApiFootballCall(args: { matchId?: string | null; endpoint: string; statusCode?: number | null; dayKey?: string }) {
  await prisma.apiCallLog.create({
    data: {
      dayKey: args.dayKey ?? getEstDayKey(new Date()),
      matchId: args.matchId ?? null,
      endpoint: args.endpoint,
      statusCode: args.statusCode ?? null
    }
  });
}

export async function getApiFootballBudget(dayKey = getEstDayKey(new Date())) {
  const used = await getCallsUsedToday(dayKey);
  const reservedLimit = API_FOOTBALL_DAILY_LIMIT - API_FOOTBALL_SAFETY_RESERVE;
  return {
    dayKey,
    dailyLimit: API_FOOTBALL_DAILY_LIMIT,
    safetyReserve: API_FOOTBALL_SAFETY_RESERVE,
    reservedLimit,
    used,
    remaining: Math.max(0, reservedLimit - used)
  };
}
