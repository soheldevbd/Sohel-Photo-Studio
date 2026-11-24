import { randomBytes } from "node:crypto";
import { users, oid } from "@/lib/server/db";
import { handle, HttpError, json, readJson, str } from "@/lib/server/http";
import { hashPassword, requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";

const DAY = 86400000;
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = oid((await ctx.params).id), b = await readJson(req), action = str(b.action, 20);
  const col = await users(), u = id && (await col.findOne({ _id: id }));
  if (!id || !u) throw new HttpError(404, "ইউজার পাওয়া যায়নি।");
  const start = Math.max(Date.now(), u.plan === "pro" ? u.proUntil || 0 : 0);
  let set: any = null, extra: any = {};
  switch (action) {
    case "pro": set = { plan: "pro", proUntil: start + (+(await getSettings()).plans[0].days || 30) * DAY }; break;
    case "days": {
      const n = Math.round(Number(b.days));
      if (!(n >= 1 && n <= 800)) throw new HttpError(400, "দিন ১ থেকে ৮০০-র মধ্যে দিন।");
      set = { plan: "pro", proUntil: start + n * DAY }; break;
    }
    case "free": set = { plan: "free", proUntil: 0 }; break;
    case "reset": set = { used1080: 0 }; break;
    case "unban": set = { banned: false }; break;
    case "ban":
      if (u.role === "admin") throw new HttpError(400, "অ্যাডমিনকে ব্যান করা যায় না।");
      set = { banned: true }; break;
    case "resetPassword": {
      const temp = randomBytes(6).toString("base64url"); // shown to the admin once
      set = { passHash: await hashPassword(temp), failed: 0, lockUntil: 0 };
      await col.updateOne({ _id: id }, { $set: set, $inc: { tv: 1 } }); // tv++ signs the user out everywhere
      return json({ ok: true, tempPassword: temp });
    }
    default: throw new HttpError(400, "অ্যাকশন সঠিক নয়।");
  }
  await col.updateOne({ _id: id }, { $set: set });
  return json({ ok: true, ...extra, self: id.equals(admin._id) });
});
