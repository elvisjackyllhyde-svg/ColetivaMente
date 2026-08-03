import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { payments } from "../../../../db/schema";

export async function GET(request: Request) {
  const db = getDb();
  const user = await getCurrentUser(request, db);
  if (!user) return Response.json({ error: "Entre na sua conta para consultar seus pagamentos." }, { status: 401 });
  const rows = await db.select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(50);
  return Response.json({
    payments: rows.map(row => ({
      amountCents: row.amountCents,
      currency: row.currency,
      status: row.status,
      createdAt: row.createdAt,
      approvedAt: row.approvedAt,
    })),
  });
}
