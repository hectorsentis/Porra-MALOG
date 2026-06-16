import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/chat/repository";

type ParticipantRow = {
  email: string | null;
  alias: string;
};

const globalForChatPrisma = globalThis as unknown as { chatReadonlyPrisma?: PrismaClient };

function participantDatabaseUrl() {
  return process.env.CHAT_PRISMA_READONLY_URL ?? process.env.DATABASE_URL;
}

function chatReadonlyPrisma() {
  const url = participantDatabaseUrl();
  if (!url) throw new Error("CHAT_PRISMA_READONLY_URL or DATABASE_URL is required");

  globalForChatPrisma.chatReadonlyPrisma ??= new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

  return globalForChatPrisma.chatReadonlyPrisma;
}

export async function findParticipantByEmail(email: string) {
  const rows = await chatReadonlyPrisma().$queryRaw<ParticipantRow[]>`
    SELECT "Email" AS email, "Alias" AS alias
    FROM "tbl_participantes"
    WHERE "Email" IS NOT NULL AND lower("Email") = ${normalizeEmail(email)}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

