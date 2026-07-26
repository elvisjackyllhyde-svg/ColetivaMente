import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";
import { csrfError, verifyCsrf } from "../../../../../db/csrf";
import { raffles } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre na sua conta para recuperar este painel." }, { status: 401 });
  if (!(await verifyCsrf(request, db))) return csrfError();
  const body = await request.json() as { legacyToken?: string };
  const token = String(body.legacyToken || "");
  if (!token) return Response.json({ error: "Código antigo ausente." }, { status: 400 });
  const [raffle] = await db.select().from(raffles).where(and(eq(raffles.slug, slug), eq(raffles.adminToken, token), or(isNull(raffles.creatorUserId), eq(raffles.creatorUserId, user.id)))).limit(1);
  if (!raffle && !user.isAdmin) return Response.json({ error: "Não foi possível recuperar este painel." }, { status: 403 });
  const target = raffle || (await db.select().from(raffles).where(and(eq(raffles.slug, slug), eq(raffles.adminToken, token))).limit(1))[0];
  if (!target) return Response.json({ error: "Não foi possível recuperar este painel." }, { status: 403 });
  await db.update(raffles).set({ creatorUserId: user.id, adminToken: crypto.randomUUID() }).where(eq(raffles.id, target.id));
  return Response.json({ ok: true });
}
