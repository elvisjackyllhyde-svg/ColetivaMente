import { db } from "../../../../../lib/raw-db";
import { notifyQuizRoom } from "../../../../../lib/quiz-live";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { playerId, playerKey } = await req.json() as { playerId?: number; playerKey?: string };
  const d1 = db();
  const room = await d1.prepare("SELECT id,status FROM rooms WHERE code=?").bind(code).first<{ id: number; status: string }>();
  if (!room) return Response.json({ error: "Sala não encontrada." }, { status: 404 });
  if (room.status !== "lobby") return Response.json({ error: "A partida já começou." }, { status: 409 });
  const player = await d1.prepare("SELECT id FROM players WHERE id=? AND room_id=? AND player_key=?").bind(playerId, room.id, playerKey).first();
  if (!player) return Response.json({ error: "Jogador inválido." }, { status: 403 });
  await d1.prepare("UPDATE players SET is_ready=1 WHERE id=?").bind(playerId).run();
  await notifyQuizRoom(code, "player-ready");
  return Response.json({ ok: true });
}
