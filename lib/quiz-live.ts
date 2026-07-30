import { env } from "cloudflare:workers";

type QuizLiveNamespace = {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
};

type QuizSocketIdentity = { role: "host" | "player"; playerId?: number };

function namespace(): QuizLiveNamespace | null {
  return (env as unknown as { QUIZ_ROOMS?: QuizLiveNamespace }).QUIZ_ROOMS ?? null;
}

export async function notifyQuizRoom(code: string, event: string): Promise<boolean> {
  const binding = namespace();
  if (!binding) return false;
  try {
    const stub = binding.get(binding.idFromName(code));
    const response = await stub.fetch("https://quiz-room.internal/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, event }),
    });
    return response.ok;
  } catch {
    // O D1 já contém o estado novo. Polling e reconexão recuperam a sala.
    return false;
  }
}

export async function issueQuizLiveTicket(code: string, identity: QuizSocketIdentity): Promise<string> {
  const binding = namespace();
  if (!binding) throw new Error("Tempo real indisponível");
  const stub = binding.get(binding.idFromName(code));
  const response = await stub.fetch("https://quiz-room.internal/ticket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, ...identity }),
  });
  if (!response.ok) throw new Error("Não foi possível preparar a conexão em tempo real");
  const data = await response.json() as { ticket?: string };
  if (!data.ticket) throw new Error("Ingresso de conexão inválido");
  return data.ticket;
}
