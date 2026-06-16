import { NextResponse } from "next/server";
import { createChatRealtimeToken, getChatSession } from "@/lib/chat/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getChatSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    realtimeToken: createChatRealtimeToken(session)
  });
}
