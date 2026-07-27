import { db } from "../../../../../lib/raw-db";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json() as { name?: string; email?: string; consent?: boolean };
  const name = body.name?.trim().slice(0, 24);
  const email = body.email?.trim().toLowerCase().slice(0, 120);

  if (!name || name.length < 2) return Response.json({ error: "Informe seu nome." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Informe um e-mail válido." }, { status: 400 });
  if (body.consent !== true) return Response.json({ error: "Aceite a Política de Privacidade para participar." }, { status: 400 });

  const d1 = db();
  const room = await d1.prepare("SELECT id,status FROM rooms WHERE code=?").bind(code).first<{ id: number; status: string }>();
  if (!room) return Response.json({ error: "Sala não encontrada." }, { status: 404 });
  if (room.status !== "lobby") return Response.json({ error: "A partida já começou." }, { status: 409 });

  const key = crypto.randomUUID();
  try {
    const result = await d1.prepare("INSERT INTO players (room_id,player_key,name,email,score,joined_at,consented_at) VALUES (?,?,?,?,?,?,?)").bind(room.id, key, name, email, 0, Date.now(), new Date().toISOString()).run();
    return Response.json({ playerId: result.meta.last_row_id, playerKey: key }, { status: 201 });
  } catch {
    return Response.json({ error: "Este nome já está na sala." }, { status: 409 });
  }
}
