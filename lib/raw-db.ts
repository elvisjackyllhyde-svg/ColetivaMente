import { env } from "cloudflare:workers";
export function db() { if (!env.DB) throw new Error("Banco de dados indisponível"); return env.DB; }
