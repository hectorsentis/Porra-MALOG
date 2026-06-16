import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasChatSecret, setChatSession } from "@/lib/chat/auth";
import { findChatUserByEmail, hasSupabaseChatConfig, markChatUserLogin } from "@/lib/chat/repository";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  if (!hasChatSecret() || !hasSupabaseChatConfig()) {
    return NextResponse.json({ error: "Falta configurar la sesion del chat" }, { status: 500 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email o password no valido" }, { status: 400 });
  }

  const user = await findChatUserByEmail(parsed.data.email);
  const valid = user ? await bcrypt.compare(parsed.data.password, user.password_hash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Email o password no valido" }, { status: 401 });
  }

  await markChatUserLogin(user.id);
  await setChatSession({ userId: user.id, alias: user.alias });

  return NextResponse.json({ user: { alias: user.alias } });
}
