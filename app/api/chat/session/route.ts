import { NextResponse } from "next/server";
import { getChatSession } from "@/lib/chat/auth";
import { getChatUserById } from "@/lib/chat/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getChatSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await getChatUserById(session.userId);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user: { alias: user.alias } });
}

