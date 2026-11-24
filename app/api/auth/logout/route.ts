import { handle, json } from "@/lib/server/http";
import { clearSessionCookie } from "@/lib/server/auth";
export const POST = handle(async () => { const res = json({ ok: true }); clearSessionCookie(res); return res; });
