import { questions, type QuizQuestion } from "./questions.ts";

export function roomQuestions(value: unknown): QuizQuestion[] {
  if (typeof value !== "string" || !value) return questions;
  try { const parsed=JSON.parse(value) as QuizQuestion[]; return Array.isArray(parsed)&&parsed.length?parsed:questions; }
  catch { return questions; }
}

export function validateQuestions(value: unknown): QuizQuestion[] | null {
  if (!Array.isArray(value) || value.length < 1) return null;
  const clean=value.map((q:Record<string,unknown>)=>({text:String(q?.text??"").trim().slice(0,500),options:Array.isArray(q?.options)?q.options.map(x=>String(x).trim().slice(0,300)):[],correct:Number(q?.correct),explanation:String(q?.explanation??"").trim().slice(0,800),timeLimit:15}));
  return clean.every(q=>q.text&&q.options.length===4&&q.options.every(Boolean)&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4)?clean:null;
}
