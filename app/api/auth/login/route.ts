import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, verifyPassword } from "../../../../db/auth";
import { clearAccountLoginFailures, loginBlockStatus, recordLoginFailure } from "../../../../lib/login-rate-limit";

const blocked = (retryAfter: number) => Response.json(
  { error: "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente." },
  { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfter))) } },
);

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  const password = String(body.password || "");
  const rate = await loginBlockStatus(request, email);
  if (rate.retryAfter > 0) return blocked(rate.retryAfter);
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || password.length > 256 || !(await verifyPassword(password, user.passwordHash))) {
    const retryAfter = await recordLoginFailure(rate.keys);
    if (retryAfter > 0) return blocked(retryAfter);
    return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }
  await clearAccountLoginFailures(rate.keys.account);
  const cookie = await createSession(db, user.id);
  return Response.json({ id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt }, { headers: { "Set-Cookie": cookie } });
}
