import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { campaigns, feedback, options } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; const body = await request.json() as { voterId?: string; opinions?: Array<{ category?: string; optionId?: number; comment?: string }> }; const db = getDb();
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    if (!campaign || !campaign.closed || !campaign.feedbackOpen) return Response.json({ error: "A rodada de opiniões ainda não está aberta." }, { status: 409 });
    const voterId = String(body.voterId || "").slice(0, 80), opinions = Array.isArray(body.opinions) ? body.opinions.slice(0, 20) : [];
    const campaignOptions = await db.select().from(options).where(eq(options.campaignId, campaign.id));
    const categories = [...new Set(campaignOptions.map(o => o.category))];
    if (!voterId || opinions.length !== categories.length) return Response.json({ error: "Responda brevemente sobre cada vencedor." }, { status: 400 });
    const values = opinions.map(opinion => { const option = campaignOptions.find(o => o.id === Number(opinion.optionId) && o.category === opinion.category); const comment = String(opinion.comment || "").trim().slice(0, 300); if (!option || comment.length < 5) throw new Error("Responda brevemente sobre cada vencedor."); return { campaignId: campaign.id, optionId: option.id, category: option.category, voterId, comment }; });
    await db.insert(feedback).values(values);
    return Response.json({ ok: true });
  } catch (error) { const msg=error instanceof Error?error.message:""; if(msg.includes("UNIQUE")||msg.includes("unique"))return Response.json({error:"Você já enviou suas opiniões."},{status:409}); return Response.json({error:msg||"Não foi possível enviar."},{status:400}); }
}
