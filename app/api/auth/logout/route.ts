import { getDb } from "../../../../db";
import { clearSessionCookie, deleteSession } from "../../../../db/auth";

export async function POST(request: Request) {
  const db = getDb();
  await deleteSession(db, request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
