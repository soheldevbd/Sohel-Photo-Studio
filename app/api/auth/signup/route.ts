import { users, isDup } from "@/lib/server/db";
import { handle, HttpError, json, readJson, str } from "@/lib/server/http";
import { hashPassword, publicUser, setSessionCookie, signSession, validEmail } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const POST = handle(async (req) => {
  const b = await readJson(req);
  const name = str(b.name, 60), email = str(b.email, 120).toLowerCase(), pass = typeof b.password === "string" ? b.password : "";
  if (!validEmail(email)) throw new HttpError(400, "ইমেইলটি সঠিক নয়।");
  if (pass.length < 6 || pass.length > 72) throw new HttpError(400, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন।");
  const now = Date.now();
  // role is always "user" here. Admins are created only with `npm run make-admin`
  const doc: any = { email, name, passHash: await hashPassword(pass), role: "user", plan: "free", proUntil: 0, used1080: 0, banned: false, tv: 0, failed: 0, lockUntil: 0, createdAt: now, lastLogin: now };
  try { doc._id = (await (await users()).insertOne(doc)).insertedId; }
  catch (e) { if (isDup(e)) throw new HttpError(409, "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।"); throw e; }
  const res = json({ user: publicUser(doc) }, 201);
  setSessionCookie(res, await signSession(doc._id.toString(), 0));
  return res;
});
