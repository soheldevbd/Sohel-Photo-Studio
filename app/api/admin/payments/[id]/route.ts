import { payments, users, oid } from "@/lib/server/db";
import { handle, HttpError, json, readJson, str } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

const DAY = 86400000;
export const POST = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = oid((await ctx.params).id), action = str((await readJson(req)).action, 10);
  if (!id || !["approve", "reject"].includes(action)) throw new HttpError(400, "অনুরোধ সঠিক নয়।");
  const col = await payments();
  // flip pending -> final in one atomic step, so a double click can never extend Pro twice
  const p = await col.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: action === "approve" ? "approved" : "rejected", reviewedAt: Date.now(), reviewedBy: admin.email } }, { returnDocument: "before" });
  if (!p) throw new HttpError(409, "এই অনুরোধ আগেই প্রসেস হয়েছে।");
  if (action === "approve") {
    const ucol = await users(), uid = oid(p.uid), u = uid && (await ucol.findOne({ _id: uid }));
    if (!u) { await col.updateOne({ _id: id }, { $set: { status: "pending" } }); throw new HttpError(404, "ইউজার পাওয়া যায়নি।"); }
    const start = Math.max(Date.now(), u.plan === "pro" ? u.proUntil || 0 : 0);
    await ucol.updateOne({ _id: u._id }, { $set: { plan: "pro", proUntil: start + Math.min(+p.days || 30, 800) * DAY } });
  }
  return json({ ok: true });
});
