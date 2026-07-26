import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { consumeAuthToken } from "../../../../db/auth-tokens";
import { users } from "../../../../db/schema";
import { verifyRequestOrigin } from "../../../../db/csrf";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { token = "" } = await request.json() as { token?: string };
  const db = getDb(), row = await consumeAuthToken(db, String(token), "verify_email");
  if (!row) return Response.json({ error: "Link inválido ou expirado." }, { status: 400 });
  await db.update(users).set({ emailVerifiedAt: new Date().toISOString() }).where(eq(users.id, row.userId));
  return Response.json({ ok: true });
}
