import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { db } from "../../../../lib/raw-db";
import { roomQuestions } from "../../../../lib/room-quiz";

type ActivityRow = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  created_at: string | number;
  participants: number;
  interactions: number;
  questions_json?: string | null;
};

export async function GET(request: Request) {
  const user = await getCurrentUser(request, getDb());
  if (!user) return Response.json({ error: "Entre na sua conta para consultar suas atividades." }, { status: 401 });
  const d1 = db();
  const [quizResult, campaignResult, raffleResult] = await Promise.all([
    d1.prepare(`SELECT r.code id, COALESCE(q.title,'GiroQuiz') title, COALESCE(q.subject,'') subtitle, q.questions_json questions_json, r.status status, r.created_at created_at,
      (SELECT COUNT(*) FROM players p WHERE p.room_id=r.id) participants,
      (SELECT COUNT(*) FROM answers a WHERE a.room_id=r.id) interactions
      FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.creator_user_id=? ORDER BY r.created_at DESC LIMIT 100`).bind(user.id).all<ActivityRow>(),
    d1.prepare(`SELECT c.slug id, c.title title, c.question subtitle,
      CASE WHEN c.feedback_open=1 THEN 'feedback' WHEN c.closed=1 THEN 'closed' ELSE 'open' END status, c.created_at created_at,
      (SELECT COUNT(*) FROM participants p WHERE p.campaign_id=c.id) participants,
      (SELECT COUNT(*) FROM votes v WHERE v.campaign_id=c.id) interactions
      FROM campaigns c WHERE c.creator_user_id=? ORDER BY c.created_at DESC LIMIT 100`).bind(user.id).all<ActivityRow>(),
    d1.prepare(`SELECT r.slug id, r.title title, r.prize_title subtitle, CASE WHEN r.closed=1 THEN 'closed' ELSE 'open' END status, r.created_at created_at,
      (SELECT COUNT(*) FROM raffle_entries e WHERE e.raffle_id=r.id) participants,
      (SELECT COUNT(DISTINCT h.draw_id) FROM raffle_winner_history h WHERE h.raffle_id=r.id) interactions
      FROM raffles r WHERE r.creator_user_id=? ORDER BY r.created_at DESC LIMIT 100`).bind(user.id).all<ActivityRow>(),
  ]);
  const normalizeDate = (value: string | number) => typeof value === "number" ? new Date(value).toISOString() : String(value).includes("T") ? String(value) : `${String(value).replace(" ", "T")}Z`;
  const activities = [
    ...quizResult.results.map(item => { const questions=roomQuestions(item.questions_json); return ({ ...item, questions_json: undefined, type: "quiz", questionPreview: questions.slice(0,3).map(question=>question.text), questionCount: questions.length, createdAt: normalizeDate(item.created_at), url: `/?modo=quiz&gerenciar=${encodeURIComponent(item.id)}` }); }),
    ...campaignResult.results.map(item => ({ ...item, type: "vote", createdAt: normalizeDate(item.created_at), url: `/?p=${encodeURIComponent(item.id)}` })),
    ...raffleResult.results.map(item => ({ ...item, type: "raffle", createdAt: normalizeDate(item.created_at), url: `/?r=${encodeURIComponent(item.id)}` })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return Response.json({ activities });
}
