import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "porra_admin_session";

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? (process.env.NODE_ENV === "development" ? "replace-with-random-strong-secret" : "");
}

function credentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? (process.env.NODE_ENV === "development" ? "admin" : ""),
    password: process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "development" ? "porra2026-local-change-me" : "")
  };
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function verifyAdminSession() {
  const store = await cookies();
  const value = store.get(cookieName)?.value;
  if (!value || !secret()) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function requireAdmin() {
  if (!(await verifyAdminSession())) redirect("/admin");
}

export async function createAdminSession(username: string, password: string) {
  const expected = credentials();
  if (!expected.username || !expected.password || username !== expected.username || password !== expected.password) {
    return false;
  }
  const payload = Buffer.from(JSON.stringify({ username, iat: Date.now() })).toString("base64url");
  const store = await cookies();
  store.set(cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return true;
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(cookieName);
}
