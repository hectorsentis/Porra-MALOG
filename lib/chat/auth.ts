import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "porra_chat_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;

export type ChatSession = {
  userId: string;
  alias: string;
};

type ChatJwtPayload = ChatSession & {
  iat: number;
  exp: number;
};

function secret() {
  return process.env.JWT_SECRET ?? process.env.CHAT_SESSION_SECRET ?? "";
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(input: string) {
  return createHmac("sha256", secret()).update(input).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function hasChatSecret() {
  return secret().length >= 32;
}

export function createChatToken(session: ChatSession) {
  if (!hasChatSecret()) throw new Error("JWT_SECRET is required");
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({ ...session, iat: now, exp: now + sessionMaxAgeSeconds });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function createChatRealtimeToken(session: ChatSession) {
  if (!hasChatSecret()) throw new Error("JWT_SECRET is required");
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    sub: session.userId,
    aud: "authenticated",
    role: "authenticated",
    alias: session.alias,
    iat: now,
    exp: now + sessionMaxAgeSeconds
  });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyChatToken(token: string | undefined): ChatSession | null {
  if (!token || !hasChatSecret()) return null;
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = sign(`${header}.${payload}`);
  if (!safeEqual(signature, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<ChatJwtPayload>;
    if (!decoded.userId || !decoded.alias || !decoded.exp) return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: decoded.userId, alias: decoded.alias };
  } catch {
    return null;
  }
}

export async function getChatSession() {
  const store = await cookies();
  return verifyChatToken(store.get(cookieName)?.value);
}

export async function setChatSession(session: ChatSession) {
  const store = await cookies();
  store.set(cookieName, createChatToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });
}

export async function clearChatSession() {
  const store = await cookies();
  store.delete(cookieName);
}
