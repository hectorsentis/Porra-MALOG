import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LIVE_ACTIVATION_THROTTLE_SEC, MAX_MATCH_DURATION_MIN, SAFETY_BUFFER_MIN } from "@/lib/api-football/constants";

const LIVE_ACTIVATION_ACTION = "LIVE_ACTIVATION_CHECK";

function subtractMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60_000);
}

async function shouldRunActivationCheck(now: Date) {
  const latest = await prisma.adminLog.findFirst({
    where: { action: LIVE_ACTIVATION_ACTION },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true }
  });
  return !latest || now.getTime() - latest.createdAt.getTime() >= LIVE_ACTIVATION_THROTTLE_SEC * 1000;
}

async function markActivationCheckRun(now: Date) {
  await prisma.adminLog.create({
    data: {
      action: LIVE_ACTIVATION_ACTION,
      message: "Comprobacion ligera de activacion live.",
      createdAt: now
    }
  });
}

export async function ensureLiveMatchesActive(now = new Date()) {
  if (!(await shouldRunActivationCheck(now))) {
    return { skipped: true, activatedMatches: 0, activatedSyncs: 0, timedOut: 0 };
  }

  const activeWindowStart = subtractMinutes(now, MAX_MATCH_DURATION_MIN);
  const timeoutWindowStart = subtractMinutes(now, MAX_MATCH_DURATION_MIN + SAFETY_BUFFER_MIN);

  const activatedMatches = await prisma.match.updateMany({
    where: {
      status: MatchStatus.PENDING,
      kickoffTime: { lte: now, gte: activeWindowStart }
    },
    data: { status: MatchStatus.DRAFT }
  });

  // Matches that activated via hora-estimation but have no API link can't
  // be polled for results — reset them to PENDING once outside the match
  // window so the admin panel shows them as pending manual entry.
  await prisma.match.updateMany({
    where: {
      status: MatchStatus.DRAFT,
      apiFootballSync: { is: null },
      kickoffTime: { lt: timeoutWindowStart }
    },
    data: { status: MatchStatus.PENDING }
  });

  const activatedSyncs = await prisma.apiFootballSync.updateMany({
    where: {
      isPollingActive: false,
      match: {
        status: MatchStatus.DRAFT,
        kickoffTime: { lte: now, gte: activeWindowStart }
      }
    },
    data: { isPollingActive: true, lastError: null }
  });

  const timedOut = await prisma.apiFootballSync.updateMany({
    where: {
      isPollingActive: true,
      match: {
        status: { not: MatchStatus.OFFICIAL },
        kickoffTime: { lt: timeoutWindowStart }
      }
    },
    data: {
      isPollingActive: false,
      lastError: "timeout sin FT - revisar manualmente"
    }
  });

  await markActivationCheckRun(now);
  return { skipped: false, activatedMatches: activatedMatches.count, activatedSyncs: activatedSyncs.count, timedOut: timedOut.count };
}
