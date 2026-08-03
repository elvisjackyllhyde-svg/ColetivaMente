import { getDb } from "../../../db";
import { getCurrentUser } from "../../../db/auth";
import { csrfError, verifyCsrf, verifyRequestOrigin } from "../../../db/csrf";
import { raffles } from "../../../db/schema";

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32);

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title || "").trim().slice(0, 80);
    const prizeTitle = String(body.prizeTitle || "").trim().slice(0, 100);
    const prizeDescription = String(body.prizeDescription || "").trim().slice(0, 300);
    const winnersCount = Math.min(Math.max(Number(body.winnersCount) || 1, 1), 50);
    if (!title || !prizeTitle) return Response.json({ error: "Informe o nome do sorteio e o prêmio." }, { status: 400 });
    const db = getDb();
    const user = await getCurrentUser(request, db);
    if (user) { if (!(await verifyCsrf(request, db))) return csrfError(); }
    else if (!verifyRequestOrigin(request)) return csrfError();
    const slug = `${slugify(title) || "sorteio"}-${crypto.randomUUID().slice(0, 6)}`;
    const adminToken = crypto.randomUUID();
    const [raffle] = await db.insert(raffles).values({ slug, adminToken, creatorUserId: user?.id ?? null, title, prizeTitle, prizeDescription, winnersCount }).returning();
    return Response.json({ slug: raffle.slug, adminToken: user ? undefined : raffle.adminToken }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar o sorteio." }, { status: 500 }); }
}
