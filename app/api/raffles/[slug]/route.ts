import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { raffleEntries, raffles } from "../../../../db/schema";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const url = new URL(request.url); const db = getDb();
  const [raffle] = await db.select().from(raffles).where(eq(raffles.slug, slug)).limit(1);
  if (!raffle) return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
  const isAdmin = url.searchParams.get("admin") === raffle.adminToken;
  const entries = await db.select().from(raffleEntries).where(eq(raffleEntries.raffleId, raffle.id)).orderBy(raffleEntries.createdAt);
  const winners = entries.filter(e => e.isWinner).sort((a, b) => (a.winnerPosition ?? 0) - (b.winnerPosition ?? 0));
  return Response.json({
    raffle: { title: raffle.title, prizeTitle: raffle.prizeTitle, prizeDescription: raffle.prizeDescription, winnersCount: raffle.winnersCount, closed: raffle.closed, isAdmin },
    entryCount: entries.length,
    entries: isAdmin ? entries.map(e => ({ name: e.name, email: e.email, createdAt: e.createdAt })) : undefined,
    winners: winners.map(w => ({ name: w.name })),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const body = await request.json() as { adminToken?: string; action?: string }; const db = getDb();
  const [raffle] = await db.select().from(raffles).where(and(eq(raffles.slug, slug), eq(raffles.adminToken, body.adminToken || ""))).limit(1);
  if (!raffle) return Response.json({ error: "Acesso administrativo inválido." }, { status: 403 });
  if (body.action === "draw") {
    const entries = await db.select().from(raffleEntries).where(eq(raffleEntries.raffleId, raffle.id));
    if (entries.length === 0) return Response.json({ error: "Ainda não há participantes inscritos." }, { status: 400 });
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(raffle.winnersCount, entries.length));
    for (let i = 0; i < picked.length; i++) {
      await db.update(raffleEntries).set({ isWinner: true, winnerPosition: i }).where(eq(raffleEntries.id, picked[i].id));
    }
    await db.update(raffles).set({ closed: true }).where(eq(raffles.id, raffle.id));
  }
  if (body.action === "reset") {
    await db.update(raffleEntries).set({ isWinner: false, winnerPosition: null }).where(eq(raffleEntries.raffleId, raffle.id));
    await db.update(raffles).set({ closed: false }).where(eq(raffles.id, raffle.id));
  }
  return Response.json({ ok: true });
}
