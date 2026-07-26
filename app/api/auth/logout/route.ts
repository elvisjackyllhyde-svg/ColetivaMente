import { getDb } from "../../../../db";
import { clearSessionCookie, deleteSession } from "../../../../db/auth";
import { csrfError, verifyCsrf } from "../../../../db/csrf";

export async function POST(request: Request) {
  const db = getDb();
  if (!(await verifyCsrf(request, db))) return csrfError();
  await deleteSession(db, request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
