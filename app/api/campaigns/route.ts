import { getDb } from "../../../db";
import { campaigns, options, rooms } from "../../../db/schema";
import { getCurrentUser } from "../../../db/auth";
import { csrfError, verifyCsrf } from "../../../db/csrf";
import { eq, sql } from "drizzle-orm";

const cleanUrl = (value: string) => {
  if (!value) return "";
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; }
};

export async function POST(request: Request) {
  try {
    const db = getDb();
    const user = await getCurrentUser(request, db);
    if (!user) return Response.json({ error: "Entre na sua conta para criar uma pesquisa." }, { status: 401 });
    if (!(await verifyCsrf(request, db))) return csrfError();
    const subscribed = user.isAdmin || user.subscriptionStatus === "lifetime" || (user.subscriptionStatus === "active" && !!user.subscriptionExpiresAt && Date.parse(user.subscriptionExpiresAt) > Date.now());
    if (!subscribed) {
      const [campaignCount, roomCount] = await Promise.all([
        db.select({ value: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.creatorUserId, user.id)),
        db.select({ value: sql<number>`count(*)` }).from(rooms).where(eq(rooms.creatorUserId, user.id)),
      ]);
      if (Number(campaignCount[0]?.value || 0) + Number(roomCount[0]?.value || 0) >= 2) return Response.json({ error: "Seus 2 testes gratuitos terminaram. Escolha um plano para continuar criando." }, { status: 403 });
    }
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title || "").trim().slice(0, 80);
    const question = String(body.question || "").trim().slice(0, 180);
    const items = Array.isArray(body.options) ? body.options.slice(0, 20) : [];
    if (!title || !question || items.length < 3) return Response.json({ error: "Informe título, pergunta e pelo menos três opções." }, { status: 400 });
    const normalized = items.map((item: any, index) => ({
      name: String(item.name || "").trim().slice(0, 80), category: String(item.category || "").trim().slice(0, 60),
      price: ["Alto", "Médio", "Baixo"].includes(item.price) ? item.price : "Médio", position: index,
    }));
    if (normalized.some(item => !item.name || !item.category)) return Response.json({ error: "Preencha nome e categoria de todas as opções." }, { status: 400 });
    const slug = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || "votacao"}-${crypto.randomUUID().slice(0, 6)}`;
    const adminToken = crypto.randomUUID();
    const [campaign] = await db.insert(campaigns).values({
      slug, adminToken, creatorUserId: user.id, title, question, hideResults: body.hideResults !== false,
      offerTitle: String(body.offerTitle || "").trim().slice(0, 100),
      offerDescription: String(body.offerDescription || "").trim().slice(0, 300),
      offerUrl: cleanUrl(String(body.offerUrl || "").trim()), offerButton: String(body.offerButton || "Conhecer a oferta").trim().slice(0, 50),
    }).returning();
    await db.insert(options).values(normalized.map(item => ({ ...item, campaignId: campaign.id })));
    return Response.json({ slug }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar a votação." }, { status: 500 }); }
}import { getDb } from "../../../db";
import { campaigns, options } from "../../../db/schema";
import { getCurrentUser } from "../../../db/auth";
import { eq, sql } from "drizzle-orm";
import { rooms } from "../../../db/schema";
import { csrfError, verifyCsrf } from "../../../db/csrf";


const cleanUrl = (value: string) => {
  if (!value) return "";
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; }
};


export async function POST(request: Request) {
  try {
    const db = getDb();
    const user = await getCurrentUser(request, db);
    if (!user) return Response.json({ error: "Entre na sua conta para criar uma pesquisa." }, { status: 401 });
    if (!(await verifyCsrf(request, db))) return csrfError();
    const subscribed = user.isAdmin || user.subscriptionStatus === "lifetime" || (user.subscriptionStatus === "active" && !!user.subscriptionExpiresAt && Date.parse(user.subscriptionExpiresAt) > Date.now());
    if (!subscribed) {
      const [campaignCount, roomCount] = await Promise.all([
        db.select({ value: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.creatorUserId, user.id)),
        db.select({ value: sql<number>`count(*)` }).from(rooms).where(eq(rooms.creatorUserId, user.id)),
      ]);
      if (Number(campaignCount[0]?.value || 0) + Number(roomCount[0]?.value || 0) >= 2) return Response.json({ error: "Seus 2 testes gratuitos terminaram. Escolha um plano para continuar criando." }, { status: 403 });
    }
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title || "").trim().slice(0, 80);
    const question = String(body.question || "").trim().slice(0, 180);
    const items = Array.isArray(body.options) ? body.options.slice(0, 20) : [];
    if (!title || !question || items.length < 3) return Response.json({ error: "Informe título, pergunta e pelo menos três opções." }, { status: 400 });
    const normalized = items.map((item: any, index) => ({
      name: String(item.name || "").trim().slice(0, 80), category: String(item.category || "").trim().slice(0, 60),
      price: ["Alto", "Médio", "Baixo"].includes(item.price) ? item.price : "Médio", position: index,
    }));
    if (normalized.some(item => !item.name || !item.category)) return Response.json({ error: "Preencha nome e categoria de todas as opções." }, { status: 400 });
    const slug = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || "votacao"}-${crypto.randomUUID().slice(0, 6)}`;
    const adminToken = crypto.randomUUID();
    const [campaign] = await db.insert(campaigns).values({
      slug, adminToken, creatorUserId: user.id, title, question, hideResults: body.hideResults !== false,
      offerTitle: String(body.offerTitle || "").trim().slice(0, 100),
      offerDescription: String(body.offerDescription || "").trim().slice(0, 300),
      offerUrl: cleanUrl(String(body.offerUrl || "").trim()), offerButton: String(body.offerButton || "Conhecer a oferta").trim().slice(0, 50),
    }).returning();
    await db.insert(options).values(normalized.map(item => ({ ...item, campaignId: campaign.id })));
