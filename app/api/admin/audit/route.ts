import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";

type RuntimeEnv = { DB: D1Database };

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request, getDb());
  if (!currentUser) return Response.json({ error: "Entre para continuar." }, { status: 401 });
  if (!currentUser.isAdmin) return Response.json({ error: "Acesso exclusivo para administradores." }, { status: 403 });
  const url = new URL(request.url);
  const requestedCategory = url.searchParams.get("category") || "";
  const category = ["access", "payment", "admin", "security"].includes(requestedCategory) ? requestedCategory : "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 250, 1), 500);
  const database = (env as unknown as RuntimeEnv).DB;
  const where = category ? "WHERE a.category = ?" : "";
  const statement = database.prepare(`
    SELECT a.id, a.category, a.action, a.severity, a.actor_user_id AS actorUserId,
      a.target_user_id AS targetUserId, a.resource_type AS resourceType,
      a.resource_id AS resourceId, a.ip_hash AS ipHash, a.user_agent AS userAgent,
      a.metadata_json AS metadataJson, a.created_at AS createdAt,
      actor.email AS actorEmail, target.email AS targetEmail
    FROM audit_logs a
    LEFT JOIN users actor ON actor.id = a.actor_user_id
    LEFT JOIN users target ON target.id = a.target_user_id
    ${where}
    ORDER BY a.id DESC LIMIT ?
  `);
  const result = category ? await statement.bind(category, limit).all() : await statement.bind(limit).all();
  const suspicious = await database.prepare("SELECT COUNT(*) AS total FROM audit_logs WHERE category = 'security' AND severity IN ('warning','critical') AND created_at >= datetime('now','-24 hours')").first<{ total: number }>();
  return Response.json({ logs: result.results, suspiciousLast24Hours: suspicious?.total || 0 }, { headers: { "Cache-Control": "no-store" } });
}
