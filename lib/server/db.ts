import { MongoClient, ObjectId, type Db } from "mongodb";

const g = globalThis as any;

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI সেট করা নেই (.env.local দেখুন)");
  if (!g.__rpsMongo) g.__rpsMongo = new MongoClient(uri).connect().catch((e) => { g.__rpsMongo = null; throw e; });
  return g.__rpsMongo;
}

// MONGODB_DB must be just a database name (letters, digits, _ or -). A common mistake is pasting the cluster host or the URI here.
function dbName() {
  const n = (process.env.MONGODB_DB || "").trim();
  if (!n) return "rotno_photo";
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(n))
    throw new Error(`MONGODB_DB="${n.slice(0, 40)}" সঠিক নয়। এখানে শুধু ডাটাবেসের নাম দিন (যেমন rotno_photo), কোনো '.' বা '/' ছাড়া। অথবা .env.local থেকে এই লাইনটাই মুছে দিন।`);
  return n;
}

export async function db(): Promise<Db> {
  const name = dbName();
  const d = (await client()).db(name);
  if (!g.__rpsIdx) {
    g.__rpsIdx = Promise.all([
      d.collection("users").createIndex({ email: 1 }, { unique: true }),
      d.collection("payments").createIndex({ trxId: 1 }, { unique: true }),
      d.collection("payments").createIndex({ uid: 1 }),
    ]).catch((e) => { g.__rpsIdx = null; console.error("index error", e.message); });
  }
  return d;
}
export const users = async () => (await db()).collection<any>("users");
export const payments = async () => (await db()).collection<any>("payments");
export const settingsCol = async () => (await db()).collection<any>("settings");
export const oid = (id: unknown) => (typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : null);
export const isDup = (e: any) => e && e.code === 11000;
