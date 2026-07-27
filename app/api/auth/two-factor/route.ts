import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { createSession } from "../../../../db/auth";
import { readAuthToken } from "../../../../db/auth-tokens";
import { authTokens, users } from "../../../../db/schema";
import { verifyRequestOrigin } from "../../../../db/csrf";
import { verifyTotp } from "../../../../db/two-factor";
import { writeAuditEvent } from "../../../../lib/audit";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { challenge = "", code = "", skip = false } = await request.json() as { challenge?: string; code?: string; skip?: boolean };
  const db = getDb(), token = await readAuthToken(db, String(challenge), "2fa_login");
  if (!token) {
    await writeAuditEvent({ request, category: "security", action: "two_factor_invalid_challenge", severity: "warning" });
    return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
  }
  const [user] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (!user?.isAdmin) return Response.json({ error: "Acesso inválido." }, { status: 403 });
  if (skip && !user.twoFactorEnabled) {
    await db.delete(authTokens).where(eq(authTokens.token, token.token));
    const session = await createSession(db, user.id);
    await writeAuditEvent({ request, category: "access", action: "two_factor_skipped", severity: "warning", actorUserId: user.id, targetUserId: user.id });
    return Response.json({ ok: true, skipped: true, csrfToken: session.csrfToken }, { headers: { "Set-Cookie": session.cookie } });
  }
  if (!(await verifyTotp(token.secret, String(code)))) {
    await writeAuditEvent({ request, category: "security", action: "two_factor_failed", severity: "critical", targetUserId: user.id });
    return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
  }
  if (!user.twoFactorEnabled) await db.update(users).set({ twoFactorSecret: token.secret, twoFactorEnabled: true }).where(eq(users.id, user.id));
  await db.delete(authTokens).where(eq(authTokens.token, token.token));
  const session = await createSession(db, user.id);
  await writeAuditEvent({ request, category: "access", action: "admin_login_success", actorUserId: user.id, targetUserId: user.id, metadata: { twoFactorEnabled: true } });
  return Response.json({ ok: true, csrfToken: session.csrfToken }, { headers: { "Set-Cookie": session.cookie } });
}
