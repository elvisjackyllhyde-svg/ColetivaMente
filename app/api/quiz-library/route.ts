import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getCurrentUser } from "../../../db/auth";
import { savedQuizzes } from "../../../db/schema";
import { validateQuestions } from "../../../lib/room-quiz";

export async function GET(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre para acessar seus quizzes." }, { status: 401 });
  const rows = await db.select().from(savedQuizzes).where(eq(savedQuizzes.userId, user.id)).orderBy(desc(savedQuizzes.updatedAt));
  return Response.json({ quizzes: rows.map(row => {
    try { return { id: row.id, title: row.title, subject: row.subject, questions: validateQuestions(JSON.parse(row.questionsJson)), musicTrack: row.musicTrack, musicScope: row.musicScope, updatedAt: row.updatedAt }; }
    catch { return null; }
  }).filter(Boolean) });
}

export async function DELETE(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre para continuar." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Quiz inválido." }, { status: 400 });
  await db.delete(savedQuizzes).where(and(eq(savedQuizzes.id, id), eq(savedQuizzes.userId, user.id)));
  return Response.json({ ok: true });
}
