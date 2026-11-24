export type ApiError = Error & { status: number; code?: string };

// Same-origin fetch to our own Next.js API (the session lives in an httpOnly cookie)
export async function api<T = any>(path: string, opts: { method?: string; json?: unknown } = {}): Promise<T> {
  const hasBody = opts.json !== undefined;
  const r = await fetch(path, {
    method: opts.method || (hasBody ? "POST" : "GET"),
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(opts.json) : undefined,
    credentials: "same-origin", cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.message || "কিছু একটা সমস্যা হয়েছে।"), { status: r.status, code: d.code }) as ApiError;
  return d as T;
}
