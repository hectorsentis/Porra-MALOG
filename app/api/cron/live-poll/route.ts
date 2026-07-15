import { NextResponse } from "next/server";
import { runApiFootballLivePoll } from "@/lib/api-football/livePoll";
import { getCachedKickoffWindows, hasMatchInLiveWindow } from "@/lib/live/kickoffCache";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Fast pre-check: read cached kickoff schedule (no DB query most of the time).
  // If no match is in the active window, skip the full poll entirely.
  try {
    const kickoffs = await getCachedKickoffWindows();
    if (!hasMatchInLiveWindow(kickoffs, now)) {
      return NextResponse.json({ skipped: true, reason: "no-match-in-window", checkedAt: now.toISOString() });
    }
  } catch {
    return NextResponse.json(
      { skipped: true, reason: "database-unavailable", checkedAt: now.toISOString() },
      { status: 503 }
    );
  }

  try {
    const result = await runApiFootballLivePoll(now);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
