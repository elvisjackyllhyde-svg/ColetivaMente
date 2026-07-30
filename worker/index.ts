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
      const ticket = url.searchParams.get("ticket");
      if (!ticket) return new Response("Ingresso obrigatório", { status: 401 });
      const id = env.QUIZ_ROOMS.idFromName(code);
      const headers = new Headers(request.headers);
      headers.set("x-quiz-code", code);
      headers.set("x-quiz-ticket", ticket);
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
