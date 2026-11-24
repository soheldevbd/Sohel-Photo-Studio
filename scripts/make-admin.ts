// ব্যবহার: npm run make-admin -- you@example.com
// আগে সাইটে ওই ইমেইলে সাইনআপ করে নিন, তারপর এই কমান্ড চালান।
import { config } from "dotenv";
import { MongoClient } from "mongodb";
config({ path: ".env.local" });

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) { console.error("ইমেইল দিন:  npm run make-admin -- you@example.com"); process.exit(1); }
  if (!process.env.MONGODB_URI) { console.error("MONGODB_URI পাওয়া যায়নি (.env.local দেখুন)"); process.exit(1); }

  const dbName = (process.env.MONGODB_DB || "").trim() || "rotno_photo";
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(dbName)) { console.error(`MONGODB_DB="${dbName}" সঠিক নয়। শুধু ডাটাবেসের নাম দিন (যেমন rotno_photo) বা লাইনটা মুছে দিন।`); process.exit(1); }
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const r = await client.db(dbName).collection("users").updateOne({ email }, { $set: { role: "admin" } });
    console.log(r.matchedCount ? `✅ ${email} এখন অ্যাডমিন। লগআউট করে আবার লগইন করুন।` : `❌ ${email} নামে কোনো ইউজার নেই। আগে সাইনআপ করুন।`);
    process.exitCode = r.matchedCount ? 0 : 1;
  } finally { await client.close(); }
}
main().catch((e) => { console.error("ত্রুটি:", e.message); process.exit(1); });
