import {
  syncMercadoPagoPayment,
  validWebhookSignature,
  webhookSecretConfigured,
} from "../../../../lib/mercado-pago";

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
    return Response.json({ error: "Notificação inválida." }, { status: 400 });
  }

  if (!webhookSecretConfigured()) {
    return Response.json({ error: "Webhook indisponível." }, { status: 503 });
  }

  if (!(await validWebhookSignature(request, dataId))) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  try {
    await syncMercadoPagoPayment(dataId);
    return Response.json({ ok: true });
  } catch (error) {
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
