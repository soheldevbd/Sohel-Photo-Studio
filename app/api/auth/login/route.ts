import { users } from "@/lib/server/db";
import { handle, HttpError, json, readJson, str } from "@/lib/server/http";
import { checkPassword, DUMMY_HASH, publicUser, setSessionCookie, signSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
const MAX_FAILS = 5, LOCK_MS = 10 * 60 * 1000;

export const POST = handle(async (req) => {
  const b = await readJson(req);
  const email = str(b.email, 120).toLowerCase(), pass = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  const col = await users();
  const u = await col.findOne({ email });
  if (u && (u.lockUntil || 0) > Date.now()) throw new HttpError(429, "অনেকবার ভুল চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।");
  const ok = await checkPassword(pass, u ? u.passHash : DUMMY_HASH);
  if (!u || !ok) {
    if (u) {
      const f = (u.failed || 0) + 1;
      await col.updateOne({ _id: u._id }, { $set: f >= MAX_FAILS ? { failed: 0, lockUntil: Date.now() + LOCK_MS } : { failed: f } });
    }
    throw new HttpError(401, "ইমেইল বা পাসওয়ার্ড ভুল।");
  }
  if (u.banned && u.role !== "admin") throw new HttpError(403, "এই অ্যাকাউন্ট ব্যান করা হয়েছে। প্রয়োজনে WhatsApp-এ যোগাযোগ করুন।", "BANNED");
  const now = Date.now();
  await col.updateOne({ _id: u._id }, { $set: { failed: 0, lockUntil: 0, lastLogin: now } });
  const res = json({ user: publicUser({ ...u, lastLogin: now }) });
  setSessionCookie(res, await signSession(u._id.toString(), u.tv || 0));
  return res;
});
