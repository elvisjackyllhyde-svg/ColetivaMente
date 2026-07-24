import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, verifyPassword } from "../../../../db/auth";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  const cookie = await createSession(db, user.id);
  return Response.json({ id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt }, { headers: { "Set-Cookie": cookie } });
}
