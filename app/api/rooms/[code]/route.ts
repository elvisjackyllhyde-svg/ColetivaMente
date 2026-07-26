import { db } from "../../../../lib/raw-db";
import { roomQuestions } from "../../../../lib/room-quiz";
import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";

const INTRO_MS = 10_000, ANSWER_MS = 15_000, TOTAL_MS = INTRO_MS + ANSWER_MS;

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url), d1 = db();
  const room = await d1.prepare("SELECT r.*,q.title,q.subject,q.questions_json,q.music_track,q.music_scope FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.code=?").bind(code).first<Record<string, number | string | null>>();
  if (!room) return Response.json({ error: "Sala não encontrada" }, { status: 404 });
  const hostKeyMatches = url.searchParams.get("hostKey") === room.host_key;
  const pid = Number(url.searchParams.get("playerId")), pkey = url.searchParams.get("playerKey");
  let host = false;
  if (hostKeyMatches) {
    const user = await getCurrentUser(req, getDb());
    if (!user || (!user.isAdmin && room.creator_user_id !== null && Number(room.creator_user_id) !== user.id)) return Response.json({ error: "Acesso administrativo inválido" }, { status: 403 });
    if (room.creator_user_id === null) await d1.prepare("UPDATE rooms SET creator_user_id=? WHERE id=? AND creator_user_id IS NULL").bind(user.id, room.id).run();
    host = true;
  } else {
    const valid = await d1.prepare("SELECT id FROM players WHERE id=? AND room_id=? AND player_key=?").bind(pid, room.id, pkey).first();
    if (!valid) return Response.json({ error: "Acesso inválido" }, { status: 403 });
  }
  const questions = roomQuestions(room.questions_json), idx = Number(room.question_index), q = idx >= 0 ? questions[idx] : null;
  let status = String(room.status);
  const elapsed = q && room.started_at ? Date.now() - Number(room.started_at) : 0, phase = elapsed < INTRO_MS ? "intro" : "answering";
  let remainingMs = phase === "intro" ? Math.max(0, INTRO_MS - elapsed) : Math.max(0, TOTAL_MS - elapsed);
  if (status === "question" && elapsed >= TOTAL_MS) { await d1.prepare("UPDATE rooms SET status='reveal' WHERE id=? AND status='question'").bind(room.id).run(); status = "reveal"; remainingMs = 0; }
  const ps = await d1.prepare("SELECT p.id,p.name,p.score, EXISTS(SELECT 1 FROM answers a WHERE a.player_id=p.id AND a.question_index=?) answered FROM players p WHERE p.room_id=? ORDER BY p.score DESC,p.joined_at ASC").bind(idx, room.id).all();
  const playerAnswer = !host && idx >= 0 ? await d1.prepare("SELECT option,correct FROM answers WHERE room_id=? AND player_id=? AND question_index=?").bind(room.id, pid, idx).first<{ option: number; correct: number }>() : null, answered = !host ? !!playerAnswer : undefined;
  return Response.json({ code, title: room.title || "GiroQuiz", subject: room.subject || "", status, phase, question: q ? { index: idx, total: questions.length, text: q.text, options: q.options, timeLimit: 15 } : null, players: ps.results, answered, playerOption: playerAnswer?.option, playerCorrect: playerAnswer ? !!playerAnswer.correct : undefined, remainingMs, correctOption: status === "reveal" || status === "finished" ? q?.correct : undefined, explanation: status === "reveal" || status === "finished" ? q?.explanation : undefined, musicTrack: room.music_track || "tic-tac-quiz", musicScope: room.music_scope || "all" });
}
