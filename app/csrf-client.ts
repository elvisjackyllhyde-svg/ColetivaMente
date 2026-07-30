let csrfToken = "";
let loadingToken: Promise<string> | null = null;
let originalFetch: typeof window.fetch | null = null;

export function rememberCsrfToken(value?: string) {
  csrfToken = value || "";
}

async function loadCsrfToken(force = false) {
  if (force) csrfToken = "";
  if (csrfToken) return csrfToken;
  const request = originalFetch || fetch;
  if (!loadingToken) loadingToken = request("/api/auth/me", { cache: "no-store", credentials: "same-origin" }).then(response => response.json()).then(data => {
    csrfToken = data.csrfToken || "";
    return csrfToken;
  }).finally(() => { loadingToken = null; });
  return loadingToken;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await loadCsrfToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("x-csrf-token", token);
  const request = originalFetch || fetch;
  let response = await request(input, { ...init, credentials: "same-origin", headers });
  if (response.status === 403) {
    const renewed = await loadCsrfToken(true);
    if (renewed && renewed !== token) {
      headers.set("x-csrf-token", renewed);
      response = await request(input, { ...init, credentials: "same-origin", headers });
    }
  }
  return response;
}

function isProtected(pathname: string, method: string) {
  if (method === "POST" && ["/api/auth/logout", "/api/billing/checkout", "/api/billing/status", "/api/campaigns", "/api/raffles", "/api/rooms"].includes(pathname)) return true;
  if (method === "PATCH" && (pathname === "/api/admin/users" || /^\/api\/(campaigns|raffles)\/[^/]+$/.test(pathname))) return true;
  if (method === "POST" && (/^\/api\/(campaigns|raffles)\/[^/]+\/claim$/.test(pathname) || /^\/api\/raffles\/[^/]+\/manual$/.test(pathname) || /^\/api\/rooms\/[^/]+\/(host|live-ticket)$/.test(pathname))) return true;
  return method === "DELETE" && pathname === "/api/quiz-library";
}

if (typeof window !== "undefined" && !(window as typeof window & { __csrfFetchInstalled?: boolean }).__csrfFetchInstalled) {
  const target = window as typeof window & { __csrfFetchInstalled?: boolean };
  target.__csrfFetchInstalled = true;
  originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    let url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.origin);
    let method = String(init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (url.origin === location.origin && url.pathname === "/api/billing/status" && method === "GET" && url.searchParams.get("payment_id")) {
      init = { ...init, method: "POST", headers: { ...Object.fromEntries(new Headers(init.headers)), "content-type": "application/json" }, body: JSON.stringify({ paymentId: url.searchParams.get("payment_id") }) };
      url = new URL("/api/billing/status", location.origin);
      input = url.pathname;
      method = "POST";
    }
    if (url.origin !== location.origin || !isProtected(url.pathname, method)) return originalFetch!(input, init);
    const token = await loadCsrfToken();
    const headers = new Headers(init.headers);
    if (token) headers.set("x-csrf-token", token);
    return originalFetch!(input, { ...init, headers });
  };
}
