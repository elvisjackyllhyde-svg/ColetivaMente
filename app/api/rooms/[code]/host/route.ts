import { db } from "../../../../../lib/raw-db";
import { roomQuestions } from "../../../../../lib/room-quiz";
import { musicTracks } from "../../../../../lib/music-tracks";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";
import { csrfError, verifyCsrf } from "../../../../../db/csrf";
import { writeAuditEvent } from "../../../../../lib/audit";
import { notifyQuizRoom } from "../../../../../lib/quiz-live";

type HostCommand = {
  hostKey?: string;
  action?: string;
  musicTrack?: string;
  musicScope?: string;
  expectedStatus?: string;
  expectedQuestionIndex?: number;
};

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { hostKey, action, musicTrack, musicScope, expectedStatus, expectedQuestionIndex } = await req.json() as HostCommand;
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
  const expected = typeof expectedStatus === "string" && Number.isInteger(expectedQuestionIndex)
    ? { status: expectedStatus, questionIndex: expectedQuestionIndex as number }
    : { status: room.status, questionIndex: room.question_index };
  let changed = false;

  if (action === "start" && expected.status === "lobby") {
    const result = await d1.prepare("UPDATE rooms SET status='question',question_index=0,started_at=? WHERE id=? AND status=? AND question_index=?").bind(Date.now(), room.id, expected.status, expected.questionIndex).run();
    changed = (result.meta.changes || 0) > 0;
  } else if (action === "reveal" && expected.status === "question") {
    const result = await d1.prepare("UPDATE rooms SET status='reveal' WHERE id=? AND status=? AND question_index=?").bind(room.id, expected.status, expected.questionIndex).run();
    changed = (result.meta.changes || 0) > 0;
  } else if (action === "next" && expected.status === "reveal") {
    const next = expected.questionIndex + 1;
    const result = next >= questions.length
      ? await d1.prepare("UPDATE rooms SET status='finished' WHERE id=? AND status=? AND question_index=?").bind(room.id, expected.status, expected.questionIndex).run()
      : await d1.prepare("UPDATE rooms SET status='question',question_index=?,started_at=? WHERE id=? AND status=? AND question_index=?").bind(next, Date.now(), room.id, expected.status, expected.questionIndex).run();
    changed = (result.meta.changes || 0) > 0;
  } else if (action === "restart") {
    const results = await d1.batch([
      d1.prepare("DELETE FROM answers WHERE room_id=? AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND status=? AND question_index=?)").bind(room.id, room.id, expected.status, expected.questionIndex),
      d1.prepare("UPDATE players SET score=0 WHERE room_id=? AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND status=? AND question_index=?)").bind(room.id, room.id, expected.status, expected.questionIndex),
      d1.prepare("UPDATE rooms SET status='lobby',question_index=-1,started_at=NULL WHERE id=? AND status=? AND question_index=?").bind(room.id, expected.status, expected.questionIndex),
    ]);
    changed = (results[2].meta.changes || 0) > 0;
  } else if (action === "cancel") {
    const result = await d1.prepare("UPDATE rooms SET status='cancelled',started_at=NULL WHERE id=? AND status=? AND question_index=?").bind(room.id, expected.status, expected.questionIndex).run();
    changed = (result.meta.changes || 0) > 0;
  } else if (action === "music") {
    if (musicTrack !== undefined && musicTracks.some(track => track.id === musicTrack)) {
      await d1.prepare("UPDATE quiz_configs SET music_track=? WHERE room_id=?").bind(musicTrack, room.id).run();
      changed = true;
    }
    if (musicScope !== undefined && ["all", "host", "off"].includes(musicScope)) {
      await d1.prepare("UPDATE quiz_configs SET music_scope=? WHERE room_id=?").bind(musicScope, room.id).run();
      changed = true;
    }
  } else {
    return Response.json({ error: "Ação não disponível" }, { status: 409 });
  }

  if (!changed) {
    const current = await d1.prepare("SELECT status,question_index FROM rooms WHERE id=?").bind(room.id).first<{ status: string; question_index: number }>();
    const alreadyApplied = action === "start" ? current?.status !== "lobby"
      : action === "reveal" ? current?.status === "reveal" && current.question_index === expected.questionIndex
      : action === "next" ? current?.status === "finished" || (current?.status === "question" && current.question_index === expected.questionIndex + 1)
      : action === "restart" ? current?.status === "lobby" && current.question_index === -1
      : action === "cancel" ? current?.status === "cancelled"
      : false;
    if (!alreadyApplied) return Response.json({ error: "A partida mudou antes deste comando. O estado foi atualizado.", stateChanged: true }, { status: 409 });
  }

  const [auditResult, liveResult] = await Promise.allSettled([
    writeAuditEvent({ request: req, category: "admin", action: `quiz_${action || "unknown"}`, actorUserId: user.id, resourceType: "quiz_room", resourceId: code }),
    notifyQuizRoom(code, `host-${action || "unknown"}`),
  ]);
  const realtimeDelivered = liveResult.status === "fulfilled" && liveResult.value;
  return Response.json({ ok: true, alreadyApplied: !changed, realtimeDelivered, auditRecorded: auditResult.status === "fulfilled" });
}
