import { and, eq, gt } from "drizzle-orm";
import type { getDb } from "./index";
import { authTokens } from "./schema";

const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");

export async function createAuthToken(db: ReturnType<typeof getDb>, userId: number, purpose: string, minutes: number, secret = "") {
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose)));
  const token = randomToken(), expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  await db.insert(authTokens).values({ token, userId, purpose, secret, expiresAt });
  return token;
}

export async function consumeAuthToken(db: ReturnType<typeof getDb>, token: string, purpose: string) {
  const [row] = await db.select().from(authTokens).where(and(eq(authTokens.token, token), eq(authTokens.purpose, purpose), gt(authTokens.expiresAt, new Date().toISOString()))).limit(1);
  if (row) await db.delete(authTokens).where(eq(authTokens.token, token));
  return row || null;
}

export async function readAuthToken(db: ReturnType<typeof getDb>, token: string, purpose: string) {
  const [row] = await db.select().from(authTokens).where(and(eq(authTokens.token, token), eq(authTokens.purpose, purpose), gt(authTokens.expiresAt, new Date().toISOString()))).limit(1);
  return row || null;
}
