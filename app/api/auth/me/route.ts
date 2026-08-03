import { getDb } from "../../../../db";
import { getCurrentUser, getOrCreateCsrfToken } from "../../../../db/auth";
import { campaigns, rooms } from "../../../../db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ user: null });
  const csrfToken = await getOrCreateCsrfToken(db, request);
  const [campaignCount, roomCount] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.creatorUserId, user.id)),
    db.select({ value: sql<number>`count(*)` }).from(rooms).where(eq(rooms.creatorUserId, user.id)),
  ]);
  const freeTrialsRemaining = Math.max(0, 2 - Number(campaignCount[0]?.value || 0) - Number(roomCount[0]?.value || 0));
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, company: user.company, subscriptionStatus: user.subscriptionStatus, subscriptionExpiresAt: user.subscriptionExpiresAt, isAdmin: user.isAdmin, freeTrialsRemaining }, csrfToken });
}
