import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { raffleEntries, raffles } from "../../../../../db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const body = await request.json() as { name?: string; email?: string; consent?: boolean };
    const name = String(body.name || "").trim().slice(0, 80);
    const email = String(body.email || "").trim().slice(0, 120);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe nome e e-mail válidos." }, { status: 400 });
    if (body.consent !== true) return Response.json({ error: "Aceite a Política de Privacidade para participar." }, { status: 400 });
    const db = getDb();
    const [raffle] = await db.select().from(raffles).where(eq(raffles.slug, slug)).limit(1);
    if (!raffle) return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
    if (raffle.closed) return Response.json({ error: "As inscrições para este sorteio já foram encerradas." }, { status: 400 });
    await db.insert(raffleEntries).values({ raffleId: raffle.id, name, email, consentedAt: new Date().toISOString() });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "Este e-mail já está inscrito neste sorteio." : "Não foi possível confirmar sua inscrição.";
    return Response.json({ error: message }, { status: error instanceof Error && error.message.includes("UNIQUE") ? 409 : 500 });
  }
}
