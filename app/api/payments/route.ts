import { payments, isDup } from "@/lib/server/db";
import { handle, HttpError, json, readJson, str } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";
import { pubPay } from "@/lib/server/pay";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const u = await requireUser(req);
  const list = await (await payments()).find({ uid: u._id.toString() }).sort({ createdAt: -1 }).limit(50).toArray();
  return json({ payments: list.map(pubPay) });
});

export const POST = handle(async (req) => {
  const u = await requireUser(req), b = await readJson(req);
  const sender = str(b.sender, 20).replace(/\s+/g, ""), trxId = str(b.trxId, 20).toUpperCase();
  if (!/^01\d{9}$/.test(sender)) throw new HttpError(400, "বিকাশ নম্বর সঠিক নয় (১১ সংখ্যা, 01 দিয়ে শুরু)।");
  if (!/^[A-Z0-9]{8,12}$/.test(trxId)) throw new HttpError(400, "TrxID সঠিক নয় (৮–১২ অক্ষর/সংখ্যা)।");
  // price and days come from the server's plan list, never from the browser
  const plan = (await getSettings()).plans.find((p) => p.name === str(b.planName, 60));
  if (!plan) throw new HttpError(400, "প্ল্যানটি পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
  const col = await payments();
  if ((await col.countDocuments({ uid: u._id.toString(), status: "pending" })) >= 5) throw new HttpError(429, "আপনার ৫টি অনুরোধ যাচাই বাকি আছে। অনুমোদনের পর আবার করুন।");
  const doc: any = { uid: u._id.toString(), email: u.email, trxId, sender, planName: plan.name, price: plan.price, days: plan.days, status: "pending", createdAt: Date.now() };
  try { doc._id = (await col.insertOne(doc)).insertedId; }
  catch (e) { if (isDup(e)) throw new HttpError(409, "এই TrxID আগে ব্যবহার হয়েছে।"); throw e; }
  return json({ payment: pubPay(doc) }, 201);
});
