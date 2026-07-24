import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { createSession, hashPassword } from "../../../../db/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = String(body.name || "").trim().slice(0, 80);
    const company = String(body.company || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
    const password = String(body.password || "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe nome e e-mail válidos." }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    const db = getDb();
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({ name, company, email, passwordHash }).returning();
    const cookie = await createSession(db, user.id);
    return Response.json({ id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus }, { status: 201, headers: { "Set-Cookie": cookie } });
  } catch (error) {
    const isDuplicate = error instanceof Error && error.message.includes("UNIQUE");
    return Response.json({ error: isDuplicate ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta." }, { status: isDuplicate ? 409 : 500 });
  }
}
