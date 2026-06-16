import { NextResponse } from "next/server";
import { clearChatSession } from "@/lib/chat/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearChatSession();
  return NextResponse.json({ ok: true });
}

