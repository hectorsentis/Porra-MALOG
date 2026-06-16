import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasChatSecret, setChatSession } from "@/lib/chat/auth";
import { findParticipantByEmail } from "@/lib/chat/participants";
import { createChatUser, findChatUserByEmail, hasSupabaseChatConfig } from "@/lib/chat/repository";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export async function POST(request: Request) {
  if (!hasChatSecret() || !hasSupabaseChatConfig()) {
    return NextResponse.json({ error: "Falta configurar la sesion del chat" }, { status: 500 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email o password no valido" }, { status: 400 });
  }

  const participant = await findParticipantByEmail(parsed.data.email);
  if (!participant) {
    return NextResponse.json({ error: "Tu email no esta en la porra" }, { status: 403 });
  }

  const existing = await findChatUserByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ error: "Ya estas registrado, haz login" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await createChatUser(parsed.data.email, participant.alias, passwordHash);
  await setChatSession({ userId: user.id, alias: user.alias });

  return NextResponse.json({ user: { alias: user.alias } }, { status: 201 });
}
