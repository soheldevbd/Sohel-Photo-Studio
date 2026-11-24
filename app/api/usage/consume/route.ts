import { users } from "@/lib/server/db";
import { handle, HttpError, json, readJson } from "@/lib/server/http";
import { effPlan, requireUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";
// Called before every render. Server decides if the size is allowed and counts the free-trial usage atomically.
export const POST = handle(async (req) => {
  const u = await requireUser(req), b = await readJson(req);
  const W = Math.round(Number(b.w)), H = Math.round(Number(b.h));
  if (!(W >= 100 && W <= 8192 && H >= 100 && H <= 8192)) throw new HttpError(400, "সাইজ সঠিক নয়।");
  const tier = Math.min(W, H) <= 720 ? "hd" : "paid";
  if (tier === "hd" || effPlan(u) === "pro") return json({ ok: true, used: u.used1080 || 0 });
  const lim = +(await getSettings()).free1080Limit || 0;
  const r = await (await users()).findOneAndUpdate({ _id: u._id, used1080: { $lt: lim } }, { $inc: { used1080: 1 } }, { returnDocument: "after" });
  if (!r) throw new HttpError(403, `আপনার ফ্রি ট্রায়ালের ${lim}টি Pro ছবি শেষ হয়ে গেছে। এখন ফ্রিতে শুধু 720p চলবে। 1080p, 1440p ও 4K-র জন্য Pro নিন।`, "LIMIT");
  return json({ ok: true, used: r.used1080 });
});
