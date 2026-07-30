import { DurableObject } from "cloudflare:workers";
import { roomQuestions } from "../lib/room-quiz";

const INTRO_MS = 10_000;
const ANSWER_MS = 15_000;
const TOTAL_MS = INTRO_MS + ANSWER_MS;

type Env = { DB: D1Database };
type SocketIdentity = { role: "host" | "player"; playerId?: number };
type RoomRow = Record<string, number | string | null>;
type PlayerRow = { id: number; name: string; score: number };
type AnswerRow = { player_id: number; option: number; correct: number };
type StateBundle = { base: Record<string, unknown>; answers: Map<number, AnswerRow> };

export class QuizRoom extends DurableObject<Env> {
  private code = "";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.code = (await ctx.storage.get<string>("code")) || "";
    });
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/sync" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as { code?: string };
      if (body.code) await this.setCode(body.code);
      await this.broadcast();
      return Response.json({ ok: true });
    }
    if (url.pathname !== "/connect" || request.headers.get("Upgrade") !== "websocket") {
      return new Response("Not found", { status: 404 });
    }
    const code = request.headers.get("x-quiz-code") || "";
    const role = request.headers.get("x-quiz-role") === "host" ? "host" : "player";
    const playerId = Number(request.headers.get("x-quiz-player-id") || 0) || undefined;
    await this.setCode(code);
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    const identity: SocketIdentity = { role, playerId };
    server.serializeAttachment(identity);
    this.ctx.acceptWebSocket(server, [role, playerId ? `player:${playerId}` : role]);
    const bundle = await this.buildState();
    if (bundle) this.send(server, identity, bundle);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message !== "state") return;
    const bundle = await this.buildState();
    if (bundle) this.send(ws, ws.deserializeAttachment() as SocketIdentity, bundle);
  }

  webSocketClose(ws: WebSocket, code: number, reason: string) { ws.close(code, reason); }

  async alarm() {
    const room = await this.loadRoom();
    if (!room || room.status !== "question" || !room.started_at) return;
    const now = Date.now(), startedAt = Number(room.started_at), index = Number(room.question_index);
    if (now >= startedAt + TOTAL_MS) {
      await this.env.DB.prepare("UPDATE rooms SET status='reveal' WHERE id=? AND status='question' AND question_index=?")
        .bind(room.id, index).run();
    }
    await this.broadcast();
  }

  private async setCode(code: string) {
    if (!code || code === this.code) return;
    this.code = code;
    await this.ctx.storage.put("code", code);
  }

  private loadRoom() {
    if (!this.code) return Promise.resolve(null);
    return this.env.DB.prepare("SELECT r.*,q.title,q.subject,q.questions_json,q.music_track,q.music_scope FROM rooms r LEFT JOIN quiz_configs q ON q.room_id=r.id WHERE r.code=?")
      .bind(this.code).first<RoomRow>();
  }

  private async buildState(): Promise<StateBundle | null> {
    const room = await this.loadRoom();
    if (!room) return null;
    const questions = roomQuestions(room.questions_json), index = Number(room.question_index);
    const question = index >= 0 ? questions[index] : null;
    const startedAt = Number(room.started_at || 0), now = Date.now();
    let status = String(room.status);
    const elapsed = startedAt ? now - startedAt : 0;
    if (status === "question" && elapsed >= TOTAL_MS) {
      await this.env.DB.prepare("UPDATE rooms SET status='reveal' WHERE id=? AND status='question' AND question_index=?")
        .bind(room.id, index).run();
      status = "reveal";
    }
    const phase = elapsed < INTRO_MS ? "intro" : "answering";
    const phaseEndsAt = status === "question" ? startedAt + (phase === "intro" ? INTRO_MS : TOTAL_MS) : now;
    const playersResult = await this.env.DB.prepare("SELECT id,name,score FROM players WHERE room_id=? ORDER BY score DESC,joined_at ASC").bind(room.id).all<PlayerRow>();
    const answers: AnswerRow[] = index >= 0
      ? (await this.env.DB.prepare("SELECT player_id,option,correct FROM answers WHERE room_id=? AND question_index=?").bind(room.id, index).all<AnswerRow>()).results
      : [];
    const answerMap = new Map<number, AnswerRow>(answers.map(answer => [Number(answer.player_id), answer]));
    const version = Number(await this.ctx.storage.get<number>("version") || 0);
    if (status === "question") await this.ctx.storage.setAlarm(phaseEndsAt);
    return { base: {
      type: "state", version, serverNow: now, phaseEndsAt, code: this.code,
      title: room.title || "GiroQuiz", subject: room.subject || "", status, phase,
      question: question ? { index, total: questions.length, text: question.text, options: question.options, timeLimit: ANSWER_MS / 1000 } : null,
      players: playersResult.results.map(player => ({ ...player, answered: answerMap.has(Number(player.id)) })),
      remainingMs: Math.max(0, phaseEndsAt - now),
      correctOption: status === "reveal" || status === "finished" ? question?.correct : undefined,
      explanation: status === "reveal" || status === "finished" ? question?.explanation : undefined,
      musicTrack: room.music_track || "tic-tac-quiz", musicScope: room.music_scope || "all",
    }, answers: answerMap };
  }

  private send(ws: WebSocket, identity: SocketIdentity, bundle: StateBundle) {
    const own = identity.playerId ? bundle.answers.get(identity.playerId) : undefined;
    const state = identity.role === "player" ? {
      ...bundle.base, answered: !!own, playerOption: own?.option, playerCorrect: own ? !!own.correct : undefined,
    } : bundle.base;
    try { ws.send(JSON.stringify(state)); } catch { /* conexão encerrada */ }
  }

  private async broadcast() {
    const version = Number(await this.ctx.storage.get<number>("version") || 0) + 1;
    await this.ctx.storage.put("version", version);
    const bundle = await this.buildState();
    if (!bundle) return;
    bundle.base.version = version;
    for (const ws of this.ctx.getWebSockets()) this.send(ws, ws.deserializeAttachment() as SocketIdentity, bundle);
  }
}
