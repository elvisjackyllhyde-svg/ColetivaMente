import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { hashPassword } from "../../../../db/auth";
import { createAuthToken } from "../../../../db/auth-tokens";
import { sendAccountEmail } from "../../../../lib/email";
import { verifyRequestOrigin } from "../../../../db/csrf";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  if (!verifyRequestOrigin(request)) return Response.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || "").trim().slice(0, 80);
    const company = String(body.company || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
    const password = String(body.password || "");
    const consent = body.consent === true;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe nome e e-mail válidos." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    if (!consent) return Response.json({ error: "Leia e aceite a Política de Privacidade para criar a conta." }, { status: 400 });
    const db = getDb();
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({ name, company, email, passwordHash, privacyAcceptedAt: new Date().toISOString() }).returning();
    const token = await createAuthToken(db, user.id, "verify_email", 24 * 60);
    const link = `${new URL(request.url).origin}/?modo=verificar-email&token=${token}`;
    const sent = await sendAccountEmail(email, "Confirme seu e-mail — ColetivaMente", `<h2>Confirme seu e-mail</h2><p>Olá, ${name}. Clique no botão para ativar sua conta:</p><p><a href="${link}">Confirmar meu e-mail</a></p><p>O link expira em 24 horas.</p>`);
    if (!sent) await db.update(users).set({ emailVerifiedAt: new Date().toISOString() }).where(eq(users.id, user.id));
    return Response.json({ created: true, emailSent: sent }, { status: 201 });
  } catch (error) {
    const isDuplicate = error instanceof Error && error.message.includes("UNIQUE");
    return Response.json({ error: isDuplicate ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta." }, { status: isDuplicate ? 409 : 500 });
  }
}
