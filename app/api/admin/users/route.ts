import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { users } from "../../../../db/schema";
import { csrfError, verifyCsrf } from "../../../../db/csrf";

async function requireAdmin(request: Request) {
  const db = getDb();
  const currentUser = await getCurrentUser(request, db);
  if (!currentUser) return { error: Response.json({ error: "Entre para continuar." }, { status: 401 }) };
  if (!currentUser.isAdmin) return { error: Response.json({ error: "Acesso exclusivo para administradores." }, { status: 403 }) };
  return { db, currentUser };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const rows = await auth.db.select({ id: users.id, name: users.name, email: users.email, company: users.company, subscriptionStatus: users.subscriptionStatus, subscriptionExpiresAt: users.subscriptionExpiresAt, totalPaidCents: users.totalPaidCents, isAdmin: users.isAdmin, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
  return Response.json({ users: rows });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  if (!(await verifyCsrf(request, auth.db))) return csrfError();
  const body = await request.json() as { userId?: number; access?: string; totalPaidCents?: number };
  const userId = Number(body.userId);
  if (!Number.isInteger(userId) || userId < 1) return Response.json({ error: "Conta inválida." }, { status: 400 });
  const update: { subscriptionStatus?: string; subscriptionExpiresAt?: string | null; totalPaidCents?: number } = {};
  if (body.access) {
    const accessDays: Record<string, number> = { "30": 30, "90": 90, "365": 365 };
    if (body.access === "lifetime") { update.subscriptionStatus = "lifetime"; update.subscriptionExpiresAt = null; }
    else if (body.access === "revoke") { update.subscriptionStatus = "inactive"; update.subscriptionExpiresAt = null; }
    else if (accessDays[body.access]) { update.subscriptionStatus = "active"; update.subscriptionExpiresAt = new Date(Date.now() + accessDays[body.access] * 86_400_000).toISOString(); }
    else return Response.json({ error: "Período de acesso inválido." }, { status: 400 });
  }
  if (body.totalPaidCents !== undefined) {
    const cents = Math.round(Number(body.totalPaidCents));
    if (!Number.isFinite(cents) || cents < 0) return Response.json({ error: "Valor pago inválido." }, { status: 400 });
    update.totalPaidCents = cents;
  }
  if (!Object.keys(update).length) return Response.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  await auth.db.update(users).set(update).where(eq(users.id, userId));
  return Response.json({ ok: true });
}
