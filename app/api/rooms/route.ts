import { db } from "../../../lib/raw-db";
import { validateQuestions } from "../../../lib/room-quiz";
import { defaultMusicTrack, musicTracks } from "../../../lib/music-tracks";
import { getDb } from "../../../db";
import { getCurrentUser } from "../../../db/auth";
export async function POST(req:Request) {
  const user=await getCurrentUser(req,getDb());
  if(!user)return Response.json({error:"Entre na sua conta para criar uma partida."},{status:401});
  if(!user.isAdmin&&user.subscriptionStatus!=="lifetime"&&(user.subscriptionStatus!=="active"||!user.subscriptionExpiresAt||Date.parse(user.subscriptionExpiresAt)<=Date.now()))return Response.json({error:"É necessário ter uma assinatura ativa para criar uma partida."},{status:403});
  const d1=db(); const now=Date.now(); const hostKey=crypto.randomUUID();
  const body=await req.json().catch(()=>({})) as {title?:string;subject?:string;questions?:unknown;musicTrack?:string;musicScope?:string}; const title=(body.title||"GiroQuiz").trim().slice(0,80),subject=(body.subject||"Desafio de conhecimento").trim().slice(0,100); const custom=body.questions===undefined?null:validateQuestions(body.questions); if(body.questions!==undefined&&!custom)return Response.json({error:"Las preguntas importadas no son válidas."},{status:400});
  const musicTrack=musicTracks.some(t=>t.id===body.musicTrack)?body.musicTrack!:defaultMusicTrack;
  const musicScope=["all","host","off"].includes(body.musicScope||"")?body.musicScope!:"all";
  for(let i=0;i<8;i++){ const code=String(Math.floor(100000+Math.random()*900000)); try { await d1.prepare("INSERT INTO rooms (code,host_key,status,question_index,created_at) VALUES (?,?,?,?,?)").bind(code,hostKey,"lobby",-1,now).run(); const room=await d1.prepare("SELECT id FROM rooms WHERE code=?").bind(code).first<{id:number}>(); await d1.prepare("INSERT INTO quiz_configs (room_id,title,subject,questions_json,music_track,music_scope) VALUES (?,?,?,?,?,?)").bind(room!.id,title,subject,custom?JSON.stringify(custom):null,musicTrack,musicScope).run(); if(custom)await d1.prepare("INSERT INTO saved_quizzes (user_id,title,subject,questions_json,music_track,music_scope,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,title) DO UPDATE SET subject=excluded.subject,questions_json=excluded.questions_json,music_track=excluded.music_track,music_scope=excluded.music_scope,updated_at=CURRENT_TIMESTAMP").bind(user.id,title,subject,JSON.stringify(custom),musicTrack,musicScope).run(); return Response.json({code,hostKey},{status:201}); } catch{} }
  return Response.json({error:"No fue posible crear una sala."},{status:500});
}
