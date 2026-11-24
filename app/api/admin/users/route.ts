import { users } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";
import { publicUser, requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const list = await (await users()).find({}, { projection: { passHash: 0 } }).sort({ createdAt: -1 }).limit(2000).toArray();
  return json({ users: list.map(publicUser) });
});
