import { db } from "../../../../../lib/raw-db";
import { roomQuestions } from "../../../../../lib/room-quiz";
import { musicTracks } from "../../../../../lib/music-tracks";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";
import { csrfError, verifyCsrf } from "../../../../../db/csrf";
import { writeAuditEvent } from "../../../../../lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { hostKey, action, musicTrack, musicScope } = await req.json() as { hostKey?: string; action?: string; musicTrack?: string; musicScope?: string };
  const d1 = db();
  const room = await d1.prepare("SELECT r.id,r.host_key,r.creator_user_id,r.status,r.question_index,q.questions_json FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.code=?").bind(code).first<{ id: number; host_key: string; creator_user_id: number | null; status: string; question_index: number; questions_json: string | null }>();
  const user = await getCurrentUser(req, getDb());
  if (user && !(await verifyCsrf(req, getDb()))) return csrfError();
  if (!room || room.host_key !== hostKey || !user || (!user.isAdmin && room.creator_user_id !== null && room.creator_user_id !== user.id)) {
    await writeAuditEvent({ request: req, category: "security", action: "quiz_admin_denied", severity: "critical", actorUserId: user?.id, resourceType: "quiz_room", resourceId: code });
    return Response.json({ error: "Acesso administrativo inválido" }, { status: 403 });
  }
  if (room.creator_user_id === null) await d1.prepare("UPDATE rooms SET creator_user_id=? WHERE id=? AND creator_user_id IS NULL").bind(user.id, room.id).run();
  const questions = roomQuestions(room.questions_json);
  if (action === "start" && room.status === "lobby") await d1.prepare("UPDATE rooms SET status='question',question_index=0,started_at=? WHERE id=?").bind(Date.now(), room.id).run();
  else if (action === "reveal" && room.status === "question") await d1.prepare("UPDATE rooms SET status='reveal' WHERE id=?").bind(room.id).run();
  else if (action === "next" && room.status === "reveal") { const next = room.question_index + 1; if (next >= questions.length) await d1.prepare("UPDATE rooms SET status='finished' WHERE id=?").bind(room.id).run(); else await d1.prepare("UPDATE rooms SET status='question',question_index=?,started_at=? WHERE id=?").bind(next, Date.now(), room.id).run(); }
  else if (action === "restart") await d1.batch([d1.prepare("DELETE FROM answers WHERE room_id=?").bind(room.id), d1.prepare("UPDATE players SET score=0 WHERE room_id=?").bind(room.id), d1.prepare("UPDATE rooms SET status='lobby',question_index=-1,started_at=NULL WHERE id=?").bind(room.id)]);
  else if (action === "cancel") await d1.prepare("UPDATE rooms SET status='cancelled',started_at=NULL WHERE id=?").bind(room.id).run();
  else if (action === "music") {
    if (musicTrack !== undefined && musicTracks.some(track => track.id === musicTrack)) await d1.prepare("UPDATE quiz_configs SET music_track=? WHERE room_id=?").bind(musicTrack, room.id).run();
    if (musicScope !== undefined && ["all", "host", "off"].includes(musicScope)) await d1.prepare("UPDATE quiz_configs SET music_scope=? WHERE room_id=?").bind(musicScope, room.id).run();
  } else return Response.json({ error: "Ação não disponível" }, { status: 409 });
  await writeAuditEvent({ request: req, category: "admin", action: `quiz_${action || "unknown"}`, actorUserId: user.id, resourceType: "quiz_room", resourceId: code });
  return Response.json({ ok: true });
}
