import { NextResponse } from "next/server";
import { z } from "zod";
import { getChatSession } from "@/lib/chat/auth";
import { countRecentMessages, createMessage, getChatUserById, listMessages } from "@/lib/chat/repository";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  contenido: z.string().trim().min(1).max(1000)
});

async function requireChatUser() {
  const session = await getChatSession();
  if (!session) return null;
  const user = await getChatUserById(session.userId);
  return user ? { userId: user.id, alias: user.alias } : null;
}

export async function GET() {
  const user = await requireChatUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const messages = await listMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await requireChatUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "El mensaje debe tener entre 1 y 1000 caracteres" }, { status: 400 });
  }

  const recentCount = await countRecentMessages(user.userId);
  if (recentCount >= 5) {
    return NextResponse.json({ error: "Demasiados mensajes seguidos. Espera unos segundos." }, { status: 429 });
  }

  const message = await createMessage(user.userId, user.alias, parsed.data.contenido);
  return NextResponse.json({ message }, { status: 201 });
}
