import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { campaigns, options, participants, votes } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; const body = await request.json() as { selections?: number[]; voterId?: string; name?: string; email?: string; consent?: boolean }; const db = getDb();
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    if (!campaign) return Response.json({ error: "Votação não encontrada." }, { status: 404 });
    if (campaign.closed) return Response.json({ error: "Esta votação foi encerrada." }, { status: 409 });
    const selections = Array.isArray(body.selections) ? body.selections.slice(0, 20).map(Number) : [];
    const name = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    if (!selections.length || !body.voterId || name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe seu nome completo e um e-mail válido." }, { status: 400 });
    if (body.consent !== true) return Response.json({ error: "Aceite a Política de Privacidade para participar." }, { status: 400 });
    const campaignOptions = await db.select().from(options).where(eq(options.campaignId, campaign.id));
    const chosen = campaignOptions.filter(option => selections.includes(option.id));
    const categories = [...new Set(campaignOptions.map(option => option.category))];
    if (chosen.length !== categories.length || new Set(chosen.map(option => option.category)).size !== categories.length) return Response.json({ error: "Escolha uma opção em cada categoria." }, { status: 400 });
    await db.insert(participants).values({ campaignId: campaign.id, voterId: body.voterId.slice(0, 80), name, email, consentedAt: new Date().toISOString() });
    await db.insert(votes).values(chosen.map(option => ({ campaignId: campaign.id, optionId: option.id, category: option.category, voterId: body.voterId!.slice(0, 80) })));
    return Response.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE") || msg.includes("unique")) return Response.json({ error: "Este e-mail já participou desta campanha." }, { status: 409 });
    return Response.json({ error: "Não foi possível registrar o voto." }, { status: 500 });
  }
}
