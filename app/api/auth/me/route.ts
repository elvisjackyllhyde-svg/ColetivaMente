import { getDb } from "../../../../db";
import { getCurrentUser, getOrCreateCsrfToken } from "../../../../db/auth";

export async function GET(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ user: null });
  const csrfToken = await getOrCreateCsrfToken(db, request);
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt, isAdmin: user.isAdmin }, csrfToken });
}
