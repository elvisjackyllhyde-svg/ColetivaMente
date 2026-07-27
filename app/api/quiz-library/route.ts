import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getCurrentUser } from "../../../db/auth";
import { savedQuizzes } from "../../../db/schema";
import { validateQuestions } from "../../../lib/room-quiz";
import { csrfError, verifyCsrf } from "../../../db/csrf";

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
  if (!(await verifyCsrf(request, db))) return csrfError();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Quiz inválido." }, { status: 400 });
  await db.delete(savedQuizzes).where(and(eq(savedQuizzes.id, id), eq(savedQuizzes.userId, user.id)));
  return Response.json({ ok: true });
}

export async function PUT(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre para continuar." }, { status: 401 });
  if (!(await verifyCsrf(request, db))) return csrfError();
  const body = await request.json().catch(() => ({})) as { id?: number; title?: string; subject?: string; questions?: unknown; musicTrack?: string; musicScope?: string };
  const id = Number(body.id), title = String(body.title || "").trim().slice(0, 80), subject = String(body.subject || "").trim().slice(0, 100);
  const questions = validateQuestions(body.questions);
  if (!Number.isInteger(id) || id < 1 || !title || !subject || !questions) return Response.json({ error: "Revise o título, o assunto e as perguntas." }, { status: 400 });
  const existing = await db.select({ id: savedQuizzes.id }).from(savedQuizzes).where(and(eq(savedQuizzes.id, id), eq(savedQuizzes.userId, user.id))).limit(1);
  if (!existing.length) return Response.json({ error: "Quiz salvo não encontrado." }, { status: 404 });
  try {
    await db.update(savedQuizzes).set({ title, subject, questionsJson: JSON.stringify(questions), musicTrack: String(body.musicTrack || "tic-tac-quiz"), musicScope: String(body.musicScope || "all"), updatedAt: new Date().toISOString() }).where(and(eq(savedQuizzes.id, id), eq(savedQuizzes.userId, user.id)));
    return Response.json({ quiz: { id, title, subject, questions, musicTrack: body.musicTrack || "tic-tac-quiz", musicScope: body.musicScope || "all", updatedAt: new Date().toISOString() } });
  } catch { return Response.json({ error: "Já existe outro quiz salvo com esse nome." }, { status: 409 }); }
}
