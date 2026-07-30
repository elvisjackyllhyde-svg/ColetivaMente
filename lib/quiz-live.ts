import { env } from "cloudflare:workers";

type QuizLiveNamespace = {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
};

function namespace(): QuizLiveNamespace | null {
  return (env as unknown as { QUIZ_ROOMS?: QuizLiveNamespace }).QUIZ_ROOMS ?? null;
}

export async function notifyQuizRoom(code: string, event: string) {
  const binding = namespace();
  if (!binding) return;
  const stub = binding.get(binding.idFromName(code));
  await stub.fetch("https://quiz-room.internal/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, event }),
  });
}
