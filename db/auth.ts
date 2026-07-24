import { eq, gt, and } from "drizzle-orm";
import type { getDb } from "./index";
import { sessions, users } from "./schema";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_DAYS = 30;
const COOKIE_NAME = "session";

const toB64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toB64(salt.buffer as ArrayBuffer)}:${toB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, iterationsStr, saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const iterations = Number(iterationsStr);
  const salt = fromB64(saltB64);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return toB64(bits) === hashB64;
}

function generateToken(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer).replace(/[+/=]/g, "");
}

export async function createSession(db: ReturnType<typeof getDb>, userId: number) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.insert(sessions).values({ token, userId, expiresAt });
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  return cookie;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(request: Request, name: string): string {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export async function getSessionToken(request: Request) {
  return readCookie(request, COOKIE_NAME);
}

export async function getCurrentUser(request: Request, db: ReturnType<typeof getDb>) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const now = new Date().toISOString();
  const [row] = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.token, token), gt(sessions.expiresAt, now))).limit(1);
  return row?.user ?? null;
}

export async function deleteSession(db: ReturnType<typeof getDb>, request: Request) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
}
