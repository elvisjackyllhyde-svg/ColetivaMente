import { db } from "../../../../../lib/raw-db";
import { roomQuestions } from "../../../../../lib/room-quiz";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser(request, getDb());
  if (!user) return Response.json({ error: "Entre na sua conta para editar este jogo." }, { status: 401 });
  const { code } = await params;
  const room = await db().prepare("SELECT r.creator_user_id,q.title,q.subject,q.questions_json,q.music_track,q.music_scope FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.code=?").bind(code).first<Record<string, string | number | null>>();
  if (!room || (!user.isAdmin && Number(room.creator_user_id) !== user.id)) return Response.json({ error: "Este jogo não pertence à sua conta." }, { status: 403 });
  return Response.json({ title: room.title || "GiroQuiz", subject: room.subject || "Desafio de conhecimento", questions: roomQuestions(room.questions_json), musicTrack: room.music_track || "tic-tac-quiz", musicScope: room.music_scope || "all" });
}
