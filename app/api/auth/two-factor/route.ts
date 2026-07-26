import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { createSession } from "../../../../db/auth";
import { readAuthToken } from "../../../../db/auth-tokens";
import { authTokens, users } from "../../../../db/schema";
import { verifyRequestOrigin } from "../../../../db/csrf";
import { verifyTotp } from "../../../../db/two-factor";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { challenge = "", code = "" } = await request.json() as { challenge?: string; code?: string };
  const db = getDb(), token = await readAuthToken(db, String(challenge), "2fa_login");
  if (!token || !(await verifyTotp(token.secret, String(code)))) return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
  const [user] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (!user?.isAdmin) return Response.json({ error: "Acesso inválido." }, { status: 403 });
  if (!user.twoFactorEnabled) await db.update(users).set({ twoFactorSecret: token.secret, twoFactorEnabled: true }).where(eq(users.id, user.id));
  await db.delete(authTokens).where(eq(authTokens.token, token.token));
  const session = await createSession(db, user.id);
  return Response.json({ ok: true, csrfToken: session.csrfToken }, { headers: { "Set-Cookie": session.cookie } });
}
