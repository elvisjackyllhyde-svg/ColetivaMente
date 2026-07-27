import {
  syncMercadoPagoPayment,
  validWebhookSignature,
  webhookSecretConfigured,
} from "../../../../lib/mercado-pago";
import { writeAuditEvent } from "../../../../lib/audit";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.clone().json().catch(() => ({})) as {
    type?: string;
    data?: { id?: string | number };
  };

  if (body.type && body.type !== "payment") {
    return Response.json({ ok: true, ignored: true });
  }

  const dataId = String(
    body.data?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "",
  );

  if (!dataId) {
    await writeAuditEvent({ request, category: "security", action: "payment_webhook_missing_id", severity: "warning" });
    return Response.json({ error: "Notificação inválida." }, { status: 400 });
  }

  if (!webhookSecretConfigured()) {
    await writeAuditEvent({ request, category: "payment", action: "payment_webhook_not_configured", severity: "critical", resourceType: "payment", resourceId: dataId });
    return Response.json({ error: "Webhook indisponível." }, { status: 503 });
  }

  if (!(await validWebhookSignature(request, dataId))) {
    await writeAuditEvent({ request, category: "security", action: "payment_webhook_invalid_signature", severity: "critical", resourceType: "payment", resourceId: dataId });
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  try {
    const result = await syncMercadoPagoPayment(dataId);
    await writeAuditEvent({ request, category: "payment", action: result.status === "approved" ? "payment_approved" : "payment_status_updated", actorUserId: result.userId, targetUserId: result.userId, resourceType: "payment", resourceId: dataId, metadata: { status: result.status, provider: "mercado_pago" } });
    return Response.json({ ok: true });
  } catch (error) {
    await writeAuditEvent({ request, category: "payment", action: "payment_webhook_processing_failed", severity: "critical", resourceType: "payment", resourceId: dataId, metadata: { retryable: true } });
    console.error("Falha temporária no webhook do Mercado Pago", {
      dataId,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
    return Response.json(
      { error: "Falha temporária ao processar a notificação." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
