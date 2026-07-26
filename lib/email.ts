import { env } from "cloudflare:workers";

export async function sendAccountEmail(to: string, subject: string, html: string) {
  const apiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  const from = (env as unknown as { EMAIL_FROM?: string }).EMAIL_FROM || "ColetivaMente <conta@coletivamente.app>";
  if (!apiKey) return false;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html }) });
  if (!response.ok) throw new Error("Falha ao enviar e-mail");
  return true;
}
