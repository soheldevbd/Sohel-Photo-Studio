import { DEFAULTS } from "./defaults";
import type { Plan, Settings, Tool, Payment } from "./types";

export const DAY = 86400000;
export const fd = (ms?: number) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const getPlans = (s: Settings): Plan[] => (Array.isArray(s.plans) && s.plans.length ? s.plans : DEFAULTS.plans);
export const getTools = (s: Settings): Tool[] => (Array.isArray(s.tools) ? s.tools : []);
export const safeUrl = (u?: string) => { try { const x = new URL(String(u || ""), location.href); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };

export function waLink(num: string, brand: string) {
  let d = String(num || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "880" + d.slice(1);
  return "https://wa.me/" + d + "?text=" + encodeURIComponent("হ্যালো, " + brand + " সম্পর্কে জানতে চাই।");
}
export const errMsg = (e: any) => (e && e.message) || "কিছু একটা সমস্যা হয়েছে।";
