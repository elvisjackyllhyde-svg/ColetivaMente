import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { csrfError, verifyCsrf, verifyRequestOrigin } from "../../../../db/csrf";
import { raffleEntries, raffles, raffleWinnerHistory } from "../../../../db/schema";
import { writeAuditEvent } from "../../../../lib/audit";

const ownsRaffleByToken = (raffle: { creatorUserId: number | null; adminToken: string }, token: string) =>
  raffle.creatorUserId === null && Boolean(token) && token === raffle.adminToken;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const db = getDb();
  const [raffle] = await db.select().from(raffles).where(eq(raffles.slug, slug)).limit(1);
  if (!raffle) return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
  const user = await getCurrentUser(request, db);
  const token = new URL(request.url).searchParams.get("admin") || "";
  const isAdmin = Boolean(user && (user.isAdmin || raffle.creatorUserId === user.id)) || ownsRaffleByToken(raffle, token);
  let accountHistory: Array<{ drawId: string; name: string; position: number; drawnAt: string; raffleTitle: string; raffleSlug: string }> = [];
  if (isAdmin) {
    if (user) {
      const ownedRaffles = user.isAdmin ? await db.select().from(raffles) : await db.select().from(raffles).where(eq(raffles.creatorUserId, user.id));
      const ownedIds = ownedRaffles.map(item => item.id);
      const allHistory = ownedIds.length ? await db.select().from(raffleWinnerHistory).where(inArray(raffleWinnerHistory.raffleId, ownedIds)).orderBy(raffleWinnerHistory.id) : [];
      const raffleById = new Map(ownedRaffles.map(item => [item.id, item]));
      accountHistory = allHistory.map(item => { const owner = raffleById.get(item.raffleId)!; return { drawId: item.drawId, name: item.winnerName, position: item.position, drawnAt: item.drawnAt, raffleTitle: owner.title, raffleSlug: owner.slug }; });
    }
  }
  const entries = await db.select().from(raffleEntries).where(eq(raffleEntries.raffleId, raffle.id)).orderBy(raffleEntries.createdAt);
  const winners = entries.filter(e => e.isWinner).sort((a, b) => (a.winnerPosition ?? 0) - (b.winnerPosition ?? 0));
  const history = isAdmin ? await db.select().from(raffleWinnerHistory).where(eq(raffleWinnerHistory.raffleId, raffle.id)).orderBy(raffleWinnerHistory.id) : [];
  return Response.json({
    raffle: { title: raffle.title, prizeTitle: raffle.prizeTitle, prizeDescription: raffle.prizeDescription, winnersCount: raffle.winnersCount, closed: raffle.closed, isAdmin },
    entryCount: entries.length,
    entries: isAdmin ? entries.map(e => ({ name: e.name, email: e.email.endsWith("@sem-email.local") ? "" : e.email, manual: e.email.endsWith("@sem-email.local"), createdAt: e.createdAt })) : undefined,
    winners: winners.map(w => ({ name: w.name })),
    history: isAdmin ? history.map(h => ({ drawId: h.drawId, name: h.winnerName, position: h.position, drawnAt: h.drawnAt })) : undefined,
    accountHistory: isAdmin ? accountHistory : undefined,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const body = await request.json() as { action?: string; adminToken?: string }; const db = getDb();
  const user = await getCurrentUser(request, db);
  if (user) { if (!(await verifyCsrf(request, db))) return csrfError(); }
  else if (!verifyRequestOrigin(request)) return csrfError();
  const [raffle] = await db.select().from(raffles).where(eq(raffles.slug, slug)).limit(1);
  const ownsByToken = raffle ? ownsRaffleByToken(raffle, String(body.adminToken || "")) : false;
  if (!raffle || !(ownsByToken || (user && (user.isAdmin || raffle.creatorUserId === user.id)))) {
    if (user) await writeAuditEvent({ request, category: "security", action: "raffle_admin_denied", severity: "critical", actorUserId: user.id, resourceType: "raffle", resourceId: slug });
    return Response.json({ error: "Acesso administrativo inválido." }, { status: 403 });
  }
  if (body.action === "draw") {
    const entries = await db.select().from(raffleEntries).where(eq(raffleEntries.raffleId, raffle.id));
    if (entries.length === 0) return Response.json({ error: "Ainda não há participantes inscritos." }, { status: 400 });
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(raffle.winnersCount, entries.length));
    const drawId = crypto.randomUUID();
    for (let i = 0; i < picked.length; i++) {
      await db.update(raffleEntries).set({ isWinner: true, winnerPosition: i }).where(eq(raffleEntries.id, picked[i].id));
      await db.insert(raffleWinnerHistory).values({ raffleId: raffle.id, drawId, entryId: picked[i].id, winnerName: picked[i].name, position: i });
    }
    await db.update(raffles).set({ closed: true }).where(eq(raffles.id, raffle.id));
  }
  if (body.action === "reset") {
    await db.update(raffleEntries).set({ isWinner: false, winnerPosition: null }).where(eq(raffleEntries.raffleId, raffle.id));
    await db.update(raffles).set({ closed: false }).where(eq(raffles.id, raffle.id));
  }
  await writeAuditEvent({ request, category: "admin", action: `raffle_${body.action || "unknown"}`, actorUserId: user?.id, resourceType: "raffle", resourceId: slug });
  return Response.json({ ok: true });
}
