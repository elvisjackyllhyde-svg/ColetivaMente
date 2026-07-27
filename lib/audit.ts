import { getDb } from "../db";
import { auditLogs } from "../db/schema";

export type AuditCategory = "access" | "payment" | "admin" | "security";
export type AuditSeverity = "info" | "warning" | "critical";

type AuditEvent = {
  request?: Request;
  category: AuditCategory;
  action: string;
  severity?: AuditSeverity;
  actorUserId?: number | null;
  targetUserId?: number | null;
  resourceType?: string;
  resourceId?: string | number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const safeText = (value: unknown, maximum: number) => String(value ?? "").slice(0, maximum);

async function requestFingerprint(request?: Request) {
  if (!request) return { ipHash: "", userAgent: "" };
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "";
  let ipHash = "";
  if (forwarded) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(forwarded.trim()));
    ipHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return { ipHash, userAgent: safeText(request.headers.get("user-agent"), 240) };
}

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.toLowerCase().split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "não informado";
}

export async function writeAuditEvent(event: AuditEvent) {
  try {
    const fingerprint = await requestFingerprint(event.request);
    const metadata = Object.fromEntries(Object.entries(event.metadata || {}).filter(([, value]) => value !== undefined));
    await getDb().insert(auditLogs).values({
      category: event.category,
      action: safeText(event.action, 100),
      severity: event.severity || "info",
      actorUserId: event.actorUserId || null,
      targetUserId: event.targetUserId || null,
      resourceType: safeText(event.resourceType, 80),
      resourceId: safeText(event.resourceId, 120),
      ipHash: fingerprint.ipHash,
      userAgent: fingerprint.userAgent,
      metadataJson: JSON.stringify(metadata).slice(0, 3000),
    });
  } catch (error) {
    console.error("Não foi possível gravar o evento de auditoria", {
      category: event.category,
      action: event.action,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
  }
}
