import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, verifyPassword } from "../../../../db/auth";
import { clearAccountLoginFailures, loginBlockStatus, recordLoginFailure } from "../../../../lib/login-rate-limit";
import { verifyRequestOrigin } from "../../../../db/csrf";
import { createAuthToken } from "../../../../db/auth-tokens";
import { newTotpSecret, totpUri } from "../../../../db/two-factor";
import { maskEmail, writeAuditEvent } from "../../../../lib/audit";

const blocked = (retryAfter: number) => Response.json(
  { error: "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente." },
  { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfter))) } },
);

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  const body = await request.json() as { email?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(body.password || "");
  const rate = await loginBlockStatus(request, email);
  if (rate.retryAfter > 0) {
    await writeAuditEvent({ request, category: "security", action: "login_blocked", severity: "warning", metadata: { account: maskEmail(email), retryAfter: rate.retryAfter } });
    return blocked(rate.retryAfter);
  }
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || password.length > 256 || !(await verifyPassword(password, user.passwordHash))) {
    const retryAfter = await recordLoginFailure(rate.keys);
    await writeAuditEvent({ request, category: "security", action: retryAfter > 0 ? "login_rate_limit_triggered" : "login_failed", severity: retryAfter > 0 ? "critical" : "warning", targetUserId: user?.id, metadata: { account: maskEmail(email), blocked: retryAfter > 0 } });
    if (retryAfter > 0) return blocked(retryAfter);
    return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    await writeAuditEvent({ request, category: "security", action: "login_unverified_email", severity: "warning", targetUserId: user.id });
    return Response.json({ error: "Confirme seu e-mail antes de entrar." }, { status: 403 });
  }
  await clearAccountLoginFailures(rate.keys.account);
  if (user.isAdmin) {
    const setup = !user.twoFactorEnabled;
    const secret = setup ? newTotpSecret() : user.twoFactorSecret;
    const challenge = await createAuthToken(db, user.id, "2fa_login", 10, secret);
    await writeAuditEvent({ request, category: "access", action: "admin_login_challenge", actorUserId: user.id, targetUserId: user.id, metadata: { setup } });
    return Response.json({ requiresTwoFactor: true, setup, challenge, secret: setup ? secret : undefined, otpAuthUri: setup ? totpUri(user.email, secret) : undefined });
  }
  const session = await createSession(db, user.id);
  await writeAuditEvent({ request, category: "access", action: "login_success", actorUserId: user.id, targetUserId: user.id });
  return Response.json({ id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt, csrfToken: session.csrfToken }, { headers: { "Set-Cookie": session.cookie } });
}
