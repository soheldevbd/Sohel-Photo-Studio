import { DEFAULTS } from "../defaults";
import type { Plan, Settings, Tool } from "../types";
import { settingsCol } from "./db";
import { HttpError, str } from "./http";

export async function getSettings(): Promise<Settings> {
  const d = await (await settingsCol()).findOne({ _id: "public" as any });
  if (!d) return DEFAULTS;
  const { _id, ...rest } = d;
  return { ...DEFAULTS, ...rest };
}

const num = (v: unknown, min: number, max: number, def: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const httpUrl = (v: string) => (/^https?:\/\/\S+$/i.test(v) ? v : "");

// Never trust the admin form blindly: clamp sizes, drop bad URLs
export function sanitizeSettings(b: any): Settings {
  if (!Array.isArray(b?.plans) || !b.plans.length || b.plans.length > 12) throw new HttpError(400, "কমপক্ষে ১টা এবং সর্বোচ্চ ১২টা প্ল্যান দিন।");
  const plans: Plan[] = b.plans.map((p: any) => ({
    name: str(p?.name, 60) || "Pro", price: num(p?.price, 0, 100000, 0), oldPrice: num(p?.oldPrice, 0, 100000, 0), days: Math.round(num(p?.days, 1, 800, 30)), features: str(p?.features, 200),
  }));
  if (new Set(plans.map((p) => p.name)).size !== plans.length) throw new HttpError(400, "প্ল্যানের নাম আলাদা হতে হবে।");
  const tools: Tool[] = (Array.isArray(b.tools) ? b.tools : []).slice(0, 30).map((t: any) => ({
    icon: str(t?.icon, 8) || "🧰", tag: str(t?.tag, 20), name: str(t?.name, 80), short: str(t?.short, 200), details: str(t?.details, 2000), url: httpUrl(str(t?.url, 300)),
  })).filter((t: Tool) => t.name);
  return {
    brand: str(b.brand, 60) || DEFAULTS.brand, whatsapp: str(b.whatsapp, 20), bkash: str(b.bkash, 20),
    price: plans[0].price, proDays: plans[0].days, free1080Limit: Math.round(num(b.free1080Limit, 0, 1000, DEFAULTS.free1080Limit)),
    notice: str(b.notice, 500), ticker: str(b.ticker, 300), tools, plans,
    guide: typeof b.guide === "string" ? b.guide.slice(0, 8000) : DEFAULTS.guide,
    promptTemplate: typeof b.promptTemplate === "string" ? b.promptTemplate.slice(0, 8000) : DEFAULTS.promptTemplate,
  };
}
