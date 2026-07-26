import { and, eq, gt } from "drizzle-orm";
import type { getDb } from "./index";
import { getSessionToken } from "./auth";
import { sessions } from "./schema";

const sameOrigin = (request: Request) => {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try { return new URL(referer).origin === expected; } catch { return false; }
};

const safeEqual = (left: string, right: string) => {
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

export async function verifyCsrf(request: Request, db: ReturnType<typeof getDb>) {
  if (!sameOrigin(request)) return false;
  const sessionToken = await getSessionToken(request);
  const supplied = request.headers.get("x-csrf-token") || "";
  if (!sessionToken || !supplied) return false;
  const [session] = await db.select().from(sessions).where(and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, new Date().toISOString()))).limit(1);
  return Boolean(session?.csrfToken && safeEqual(session.csrfToken, supplied));
}

export const csrfError = () => Response.json({ error: "A solicitação de segurança expirou. Atualize a página e tente novamente." }, { status: 403 });

export function verifyRequestOrigin(request: Request) {
  return sameOrigin(request);
}
