import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { raffleEntries, raffles } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const body = await request.json() as { name?: string; adminToken?: string };
    const name = String(body.name || "").trim().slice(0, 80);
    if (name.length < 2) return Response.json({ error: "Informe o nome do participante." }, { status: 400 });
    const db = getDb();
    const [raffle] = await db.select().from(raffles).where(and(eq(raffles.slug, slug), eq(raffles.adminToken, body.adminToken || ""))).limit(1);
    if (!raffle) return Response.json({ error: "Acesso administrativo inválido." }, { status: 403 });
    if (raffle.closed) return Response.json({ error: "Reabra o sorteio antes de adicionar participantes." }, { status: 400 });
    const email = `manual-${crypto.randomUUID()}@sem-email.local`;
    await db.insert(raffleEntries).values({ raffleId: raffle.id, name, email });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Não foi possível adicionar o participante." }, { status: 500 });
  }
}
