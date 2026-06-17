import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { syncApiFootballMatchIds } from "@/lib/api-football/syncMatches";
import { KICKOFF_CACHE_TAG } from "@/lib/live/kickoffCache";

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

  try {
    const result = await syncApiFootballMatchIds();
    revalidateTag(KICKOFF_CACHE_TAG); // kickoff times may have changed
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
