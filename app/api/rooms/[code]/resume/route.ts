import { db } from "../../../../../lib/raw-db";
import { getDb } from "../../../../../db";
import { getCurrentUser } from "../../../../../db/auth";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser(request, getDb());
  if (!user) return Response.json({ error: "Entre na sua conta para abrir esta partida." }, { status: 401 });
  const { code } = await params;
  const room = await db().prepare("SELECT host_key,creator_user_id FROM rooms WHERE code=?").bind(code).first<{ host_key: string; creator_user_id: number | null }>();
  if (!room || (!user.isAdmin && room.creator_user_id !== user.id)) return Response.json({ error: "Esta partida não pertence à sua conta." }, { status: 403 });
  return Response.json({ hostKey: room.host_key });
}
