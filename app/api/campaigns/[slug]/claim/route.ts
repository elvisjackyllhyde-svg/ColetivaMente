import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";
import { campaigns } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre na sua conta para recuperar este painel." }, { status: 401 });
  const body = await request.json() as { legacyToken?: string };
  const token = String(body.legacyToken || "");
  if (!token) return Response.json({ error: "Código antigo ausente." }, { status: 400 });
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.slug, slug), eq(campaigns.adminToken, token), or(isNull(campaigns.creatorUserId), eq(campaigns.creatorUserId, user.id)))).limit(1);
  if (!campaign && !user.isAdmin) return Response.json({ error: "Não foi possível recuperar este painel." }, { status: 403 });
  const target = campaign || (await db.select().from(campaigns).where(and(eq(campaigns.slug, slug), eq(campaigns.adminToken, token))).limit(1))[0];
  if (!target) return Response.json({ error: "Não foi possível recuperar este painel." }, { status: 403 });
  await db.update(campaigns).set({ creatorUserId: user.id, adminToken: crypto.randomUUID() }).where(eq(campaigns.id, target.id));
  return Response.json({ ok: true });
}
