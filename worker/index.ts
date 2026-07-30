/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
export { QuizRoom } from "./quiz-room";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  QUIZ_ROOMS: DurableObjectNamespace;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const liveMatch = url.pathname.match(/^\/api\/rooms\/(\d{6})\/live$/);
    if (liveMatch && request.headers.get("Upgrade") === "websocket") {
      const code = liveMatch[1];
      const hostKey = url.searchParams.get("hostKey");
      const playerId = Number(url.searchParams.get("playerId"));
      const playerKey = url.searchParams.get("playerKey");
      const room = await env.DB.prepare("SELECT id,host_key FROM rooms WHERE code=?").bind(code).first<{ id: number; host_key: string }>();
      if (!room) return new Response("Sala não encontrada", { status: 404 });
      let role: "host" | "player" = "player";
      if (hostKey && hostKey === room.host_key) role = "host";
      else {
        const player = await env.DB.prepare("SELECT id FROM players WHERE id=? AND room_id=? AND player_key=?").bind(playerId, room.id, playerKey).first();
        if (!player) return new Response("Acesso inválido", { status: 403 });
      }
      const id = env.QUIZ_ROOMS.idFromName(code);
      const headers = new Headers(request.headers);
      headers.set("x-quiz-code", code);
      headers.set("x-quiz-role", role);
      if (role === "player") headers.set("x-quiz-player-id", String(playerId));
      return env.QUIZ_ROOMS.get(id).fetch(new Request("https://quiz-room.internal/connect", { headers }));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
