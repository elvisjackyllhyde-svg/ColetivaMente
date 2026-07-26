import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { consumeAuthToken } from "../../../../db/auth-tokens";
import { hashPassword } from "../../../../db/auth";
import { sessions, users } from "../../../../db/schema";
import { verifyRequestOrigin } from "../../../../db/csrf";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { token = "", password = "" } = await request.json() as { token?: string; password?: string };
  if (String(password).length < 8 || String(password).length > 256) return Response.json({ error: "Use uma senha com pelo menos 8 caracteres." }, { status: 400 });
  const db = getDb(), row = await consumeAuthToken(db, String(token), "reset_password");
  if (!row) return Response.json({ error: "Link inválido ou expirado." }, { status: 400 });
  await db.update(users).set({ passwordHash: await hashPassword(String(password)) }).where(eq(users.id, row.userId));
  await db.delete(sessions).where(eq(sessions.userId, row.userId));
  return Response.json({ ok: true });
}
