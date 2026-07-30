import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";
import { csrfError, verifyCsrf } from "../../../../../db/csrf";
import { issueQuizLiveTicket } from "../../../../../lib/quiz-live";
import { db } from "../../../../../lib/raw-db";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await request.json().catch(() => ({})) as { hostKey?: string; playerId?: number; playerKey?: string };
  const d1 = db();
  const room = await d1.prepare("SELECT id,host_key,creator_user_id FROM rooms WHERE code=?").bind(code).first<{ id: number; host_key: string; creator_user_id: number | null }>();
  if (!room) return Response.json({ error: "Sala não encontrada" }, { status: 404 });

  if (body.hostKey) {
    const user = await getCurrentUser(request, getDb());
    if (!user || !(await verifyCsrf(request, getDb()))) return csrfError();
    if (room.host_key !== body.hostKey || (!user.isAdmin && room.creator_user_id !== user.id)) {
      return Response.json({ error: "Acesso administrativo inválido" }, { status: 403 });
    }
    return Response.json({ ticket: await issueQuizLiveTicket(code, { role: "host" }) });
  }

  const playerId = Number(body.playerId) || 0;
  const player = await d1.prepare("SELECT id FROM players WHERE id=? AND room_id=? AND player_key=?").bind(playerId, room.id, body.playerKey || "").first();
  if (!player) return Response.json({ error: "Acesso inválido" }, { status: 403 });
  return Response.json({ ticket: await issueQuizLiveTicket(code, { role: "player", playerId }) });
}
