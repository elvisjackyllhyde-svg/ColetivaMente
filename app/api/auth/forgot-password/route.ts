import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { createAuthToken } from "../../../../db/auth-tokens";
import { users } from "../../../../db/schema";
import { verifyRequestOrigin } from "../../../../db/csrf";
import { sendAccountEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { email = "" } = await request.json() as { email?: string };
  const normalized = String(email).trim().toLowerCase().slice(0, 160), db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (user) {
    const token = await createAuthToken(db, user.id, "reset_password", 30);
    const link = `${new URL(request.url).origin}/?modo=trocar-senha&token=${token}`;
    await sendAccountEmail(user.email, "Redefina sua senha — ColetivaMente", `<h2>Redefinição de senha</h2><p><a href="${link}">Criar uma nova senha</a></p><p>O link expira em 30 minutos. Ignore esta mensagem se não fez a solicitação.</p>`);
  }
  return Response.json({ ok: true });
}
