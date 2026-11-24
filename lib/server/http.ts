import { NextRequest, NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

// Reject cross-site form posts: a browser always sends Origin on unsafe methods
function assertSameOrigin(req: NextRequest) {
  const o = req.headers.get("origin"); if (!o) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let oh = ""; try { oh = new URL(o).host; } catch {}
  if (oh !== host) throw new HttpError(403, "অনুরোধ গ্রহণযোগ্য নয়।");
}

export function handle(fn: (req: NextRequest, ctx: any) => Promise<Response>) {
  return async (req: NextRequest, ctx: any) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof HttpError) return json({ message: e.message, code: e.code }, e.status);
      console.error(e);
      return json({ message: "সার্ভারে সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।" }, 500);
    }
  };
}

export async function readJson(req: NextRequest): Promise<any> {
  if (Number(req.headers.get("content-length") || 0) > 300_000) throw new HttpError(413, "ডেটা অনেক বড়।");
  try { const b = await req.json(); if (b && typeof b === "object") return b; } catch {}
  throw new HttpError(400, "অনুরোধটি সঠিক নয়।");
}
export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
