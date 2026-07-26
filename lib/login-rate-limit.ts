import { env } from "cloudflare:workers";

const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;
const ACCOUNT_LIMIT = 5;
const IP_LIMIT = 20;

type RuntimeEnv = { DB: D1Database };

const digest = async (value: string) => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
};

const clientIp = (request: Request) =>
  request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

async function keysFor(request: Request, email: string) {
  return {
    account: await digest(`account:${email}`),
    ip: await digest(`ip:${clientIp(request)}`),
  };
}

async function remainingBlockSeconds(keys: string[]) {
  const db = (env as unknown as RuntimeEnv).DB;
  const placeholders = keys.map(() => "?").join(",");
  const row = await db.prepare(`SELECT MAX(unixepoch(blocked_until) - unixepoch('now')) AS seconds FROM login_rate_limits WHERE key IN (${placeholders}) AND blocked_until > CURRENT_TIMESTAMP`).bind(...keys).first<{ seconds: number | null }>();
  return Math.max(0, Number(row?.seconds || 0));
}

export async function loginBlockStatus(request: Request, email: string) {
  const keys = await keysFor(request, email);
  return { keys, retryAfter: await remainingBlockSeconds([keys.account, keys.ip]) };
}

export async function recordLoginFailure(keys: { account: string; ip: string }) {
  const db = (env as unknown as RuntimeEnv).DB;
  const statement = (key: string, limit: number) => db.prepare(`
    INSERT INTO login_rate_limits (key, failures, window_started_at, blocked_until, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      failures = CASE WHEN window_started_at <= datetime('now', '-${WINDOW_MINUTES} minutes') THEN 1 ELSE failures + 1 END,
      window_started_at = CASE WHEN window_started_at <= datetime('now', '-${WINDOW_MINUTES} minutes') THEN CURRENT_TIMESTAMP ELSE window_started_at END,
      blocked_until = CASE
        WHEN window_started_at <= datetime('now', '-${WINDOW_MINUTES} minutes') THEN NULL
        WHEN failures + 1 >= ? THEN datetime('now', '+${BLOCK_MINUTES} minutes')
        ELSE blocked_until
      END,
      updated_at = CURRENT_TIMESTAMP
  `).bind(key, limit);
  const account = statement(keys.account, ACCOUNT_LIMIT);
  const ip = statement(keys.ip, IP_LIMIT);
  await db.batch([account, ip]);
  return remainingBlockSeconds([keys.account, keys.ip]);
}

export async function clearAccountLoginFailures(accountKey: string) {
  await (env as unknown as RuntimeEnv).DB.prepare("DELETE FROM login_rate_limits WHERE key = ?").bind(accountKey).run();
}
