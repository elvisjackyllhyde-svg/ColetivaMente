import { db } from "../../../../../lib/raw-db";
import { roomQuestions } from "../../../../../lib/room-quiz";
import { musicTracks } from "../../../../../lib/music-tracks";
export async function POST(req:Request,{params}:{params:Promise<{code:string}>}){
 const {code}=await params,{hostKey,action,musicTrack,musicScope}=await req.json() as {hostKey?:string;action?:string;musicTrack?:string;musicScope?:string},d1=db(); const room=await d1.prepare("SELECT r.id,r.host_key,r.status,r.question_index,q.questions_json FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.code=?").bind(code).first<{id:number;host_key:string;status:string;question_index:number;questions_json:string|null}>();
 if(!room||room.host_key!==hostKey)return Response.json({error:"Acesso inválido"},{status:403}); const questions=roomQuestions(room.questions_json);
 if(action==="start"&&room.status==="lobby")await d1.prepare("UPDATE rooms SET status='question',question_index=0,started_at=? WHERE id=?").bind(Date.now(),room.id).run();
 else if(action==="reveal"&&room.status==="question")await d1.prepare("UPDATE rooms SET status='reveal' WHERE id=?").bind(room.id).run();
 else if(action==="next"&&room.status==="reveal"){const next=room.question_index+1;if(next>=questions.length)await d1.prepare("UPDATE rooms SET status='finished' WHERE id=?").bind(room.id).run();else await d1.prepare("UPDATE rooms SET status='question',question_index=?,started_at=? WHERE id=?").bind(next,Date.now(),room.id).run();}
 else if(action==="restart"){await d1.batch([d1.prepare("DELETE FROM answers WHERE room_id=?").bind(room.id),d1.prepare("UPDATE players SET score=0 WHERE room_id=?").bind(room.id),d1.prepare("UPDATE rooms SET status='lobby',question_index=-1,started_at=NULL WHERE id=?").bind(room.id)]);}
 else if(action==="cancel")await d1.prepare("UPDATE rooms SET status='cancelled',started_at=NULL WHERE id=?").bind(room.id).run();
 else if(action==="music"){
  if(musicTrack!==undefined&&musicTracks.some(t=>t.id===musicTrack))await d1.prepare("UPDATE quiz_configs SET music_track=? WHERE room_id=?").bind(musicTrack,room.id).run();
  if(musicScope!==undefined&&["all","host","off"].includes(musicScope))await d1.prepare("UPDATE quiz_configs SET music_scope=? WHERE room_id=?").bind(musicScope,room.id).run();
 }
 else return Response.json({error:"Ação não disponível"},{status:409}); return Response.json({ok:true});
}
