import { db } from "../../../lib/raw-db";
import { validateQuestions } from "../../../lib/room-quiz";
import { defaultMusicTrack, musicTracks } from "../../../lib/music-tracks";
export async function POST(req:Request) {
  const d1=db(); const now=Date.now(); const hostKey=crypto.randomUUID();
  const body=await req.json().catch(()=>({})) as {title?:string;subject?:string;questions?:unknown;musicTrack?:string;musicScope?:string}; const title=(body.title||"GiroQuiz").trim().slice(0,80),subject=(body.subject||"Desafio de conhecimento").trim().slice(0,100); const custom=body.questions===undefined?null:validateQuestions(body.questions); if(body.questions!==undefined&&!custom)return Response.json({error:"Las preguntas importadas no son válidas."},{status:400});
  const musicTrack=musicTracks.some(t=>t.id===body.musicTrack)?body.musicTrack!:defaultMusicTrack;
  const musicScope=["all","host","off"].includes(body.musicScope||"")?body.musicScope!:"all";
  for(let i=0;i<8;i++){ const code=String(Math.floor(100000+Math.random()*900000)); try { await d1.prepare("INSERT INTO rooms (code,host_key,status,question_index,created_at) VALUES (?,?,?,?,?)").bind(code,hostKey,"lobby",-1,now).run(); const room=await d1.prepare("SELECT id FROM rooms WHERE code=?").bind(code).first<{id:number}>(); await d1.prepare("INSERT INTO quiz_configs (room_id,title,subject,questions_json,music_track,music_scope) VALUES (?,?,?,?,?,?)").bind(room!.id,title,subject,custom?JSON.stringify(custom):null,musicTrack,musicScope).run(); return Response.json({code,hostKey},{status:201}); } catch{} }
  return Response.json({error:"No fue posible crear una sala."},{status:500});
}
