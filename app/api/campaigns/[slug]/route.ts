import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { campaigns, feedback, options, participants, votes } from "../../../../db/schema";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const url = new URL(request.url); const db = getDb();
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
  if (!campaign) return Response.json({ error: "Votação não encontrada." }, { status: 404 });
  const isAdmin = url.searchParams.get("admin") === campaign.adminToken;
  const rows = await db.select({ id: options.id, name: options.name, category: options.category, price: options.price, position: options.position, votes: sql<number>`count(${votes.id})` }).from(options).leftJoin(votes, eq(options.id, votes.optionId)).where(eq(options.campaignId, campaign.id)).groupBy(options.id).orderBy(options.position);
  const canSee = isAdmin || campaign.closed || !campaign.hideResults;
  const leads = isAdmin ? await db.select({ name: participants.name, email: participants.email, createdAt: participants.createdAt }).from(participants).where(eq(participants.campaignId, campaign.id)).orderBy(participants.createdAt) : undefined;
  const opinions = isAdmin ? await db.select({ category: feedback.category, optionId: feedback.optionId, comment: feedback.comment, voterId: feedback.voterId, createdAt: feedback.createdAt, name: participants.name, email: participants.email }).from(feedback).leftJoin(participants, and(eq(participants.campaignId, feedback.campaignId), eq(participants.voterId, feedback.voterId))).where(eq(feedback.campaignId, campaign.id)).orderBy(feedback.createdAt) : undefined;
  return Response.json({ campaign: { title: campaign.title, question: campaign.question, closed: campaign.closed, feedbackOpen: campaign.feedbackOpen, hideResults: campaign.hideResults, offerTitle: campaign.offerTitle, offerDescription: campaign.offerDescription, offerUrl: campaign.offerUrl, offerButton: campaign.offerButton, isAdmin }, options: rows.map(r => ({ ...r, votes: canSee ? Number(r.votes) : undefined })), total: canSee ? rows.reduce((n,r)=>n+Number(r.votes),0) : undefined, participants: leads, feedback: opinions });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const body = await request.json() as { adminToken?: string; action?: string }; const db = getDb();
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.slug, slug), eq(campaigns.adminToken, body.adminToken || ""))).limit(1);
  if (!campaign) return Response.json({ error: "Acesso administrativo inválido." }, { status: 403 });
  if (body.action === "close") await db.update(campaigns).set({ closed: true, feedbackOpen: false }).where(eq(campaigns.id, campaign.id));
  if (body.action === "reopen") await db.update(campaigns).set({ closed: false }).where(eq(campaigns.id, campaign.id));
  if (body.action === "feedback") await db.update(campaigns).set({ feedbackOpen: true }).where(eq(campaigns.id, campaign.id));
  if (body.action === "endFeedback") await db.update(campaigns).set({ feedbackOpen: false }).where(eq(campaigns.id, campaign.id));
  if (body.action === "reset") { await db.delete(feedback).where(eq(feedback.campaignId, campaign.id)); await db.delete(votes).where(eq(votes.campaignId, campaign.id)); await db.update(campaigns).set({ closed: false, feedbackOpen: false }).where(eq(campaigns.id, campaign.id)); }
  return Response.json({ ok: true });
}
