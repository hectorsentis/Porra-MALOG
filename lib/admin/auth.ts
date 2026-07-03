import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "porra_admin_session";
const auditorPasswordCookieName = "porra_auditor_password";

export type AdminRole = "ADMIN" | "AUDITOR";

export type AdminSession = {
  username: string;
  role: AdminRole;
  mustChangePassword: boolean;
  iat: number;
};

type LoginResult =
  | { ok: true; session: AdminSession }
  | { ok: false };

type AuditorPasswordOverride = {
  username: string;
  passwordHash: string;
  sourceSignature: string;
};

const auditorAllowedPrefixes = [
  "/admin/resultados",
  "/admin/bonus",
  "/admin/logs",
  "/admin/rollback",
  "/admin/cambiar-password"
];

const auditorDeniedExact = new Set(["/admin/import", "/admin/bote", "/admin/reglas"]);

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? (process.env.NODE_ENV === "development" ? "replace-with-random-strong-secret" : "");
}

function adminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? (process.env.NODE_ENV === "development" ? "admin" : ""),
    password: process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "development" ? "porra2026-local-change-me" : "")
  };
}

function auditorCredentials() {
  return {
    username: process.env.AUDITOR_USERNAME ?? "",
    password: process.env.AUDITOR_PASSWORD ?? ""
  };
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function encodeSignedJson(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSignedJson<T>(value: string | undefined): T | null {
  if (!value || !secret()) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function setAdminSession(session: AdminSession) {
  const store = await cookies();
  store.set(cookieName, encodeSignedJson(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

function auditorSourceSignature(username: string, initialPassword: string) {
  return sign(`auditor:${username}:${initialPassword}`);
}

async function getAuditorPasswordOverride(username: string, initialPassword: string) {
  const store = await cookies();
  const override = decodeSignedJson<AuditorPasswordOverride>(store.get(auditorPasswordCookieName)?.value);
  if (!override || override.username !== username) return null;
  if (!safeEqual(override.sourceSignature, auditorSourceSignature(username, initialPassword))) return null;
  return override;
}

async function setAuditorPasswordOverride(username: string, initialPassword: string, password: string) {
  const store = await cookies();
  store.set(
    auditorPasswordCookieName,
    encodeSignedJson({
      username,
      passwordHash: await bcrypt.hash(password, 12),
      sourceSignature: auditorSourceSignature(username, initialPassword)
    } satisfies AuditorPasswordOverride),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 60 * 60 * 24 * 365
    }
  );
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const session = decodeSignedJson<Partial<AdminSession>>(store.get(cookieName)?.value);
  if (!session?.username || !session.iat) return null;
  return {
    username: session.username,
    role: session.role === "AUDITOR" ? "AUDITOR" : "ADMIN",
    mustChangePassword: Boolean(session.mustChangePassword),
    iat: session.iat
  };
}

export async function verifyAdminSession() {
  return Boolean(await getAdminSession());
}

export function canAccessAdminPath(role: AdminRole, path: string) {
  if (role === "ADMIN") return true;
  const normalizedPath = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  if (normalizedPath === "/admin") return true;
  if (auditorDeniedExact.has(normalizedPath)) return false;
  return auditorAllowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

export async function requireAdmin(options: { roles?: AdminRole[]; allowPasswordChange?: boolean } = {}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  if (!options.allowPasswordChange && session.mustChangePassword) redirect("/admin/cambiar-password");
  if (options.roles && !options.roles.includes(session.role)) redirect("/admin?forbidden=1");
  return session;
}

export async function requireAdminForPath(path: string) {
  const session = await requireAdmin();
  if (!canAccessAdminPath(session.role, path)) redirect("/admin?forbidden=1");
  return session;
}

export async function createAdminSession(username: string, password: string): Promise<LoginResult> {
  const expectedAdmin = adminCredentials();
  if (expectedAdmin.username && expectedAdmin.password && username === expectedAdmin.username && password === expectedAdmin.password) {
    const session = { username, role: "ADMIN" as const, mustChangePassword: false, iat: Date.now() };
    await setAdminSession(session);
    return { ok: true, session };
  }

  const expectedAuditor = auditorCredentials();
  if (expectedAuditor.username && expectedAuditor.password && username === expectedAuditor.username) {
    const override = await getAuditorPasswordOverride(username, expectedAuditor.password);
    if (override && await bcrypt.compare(password, override.passwordHash)) {
      const session = { username, role: "AUDITOR" as const, mustChangePassword: false, iat: Date.now() };
      await setAdminSession(session);
      return { ok: true, session };
    }
    if (override || password !== expectedAuditor.password) return { ok: false };
    const session = { username, role: "AUDITOR" as const, mustChangePassword: true, iat: Date.now() };
    await setAdminSession(session);
    return { ok: true, session };
  }

  return { ok: false };
}

export async function changeAuditorPassword(newPassword: string) {
  const session = await requireAdmin({ roles: ["AUDITOR"], allowPasswordChange: true });
  const expectedAuditor = auditorCredentials();
  if (session.username !== expectedAuditor.username || !expectedAuditor.password) return false;
  await setAuditorPasswordOverride(session.username, expectedAuditor.password, newPassword);
  await setAdminSession({ ...session, mustChangePassword: false, iat: Date.now() });
  return true;
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(cookieName);
}
