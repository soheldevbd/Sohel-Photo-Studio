import { handle, json } from "@/lib/server/http";
import { currentUser, publicUser } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
// 200 with user:null when signed out, so the browser console stays clean
export const GET = handle(async (req) => {
  const u = await currentUser(req);
  return json({ user: u && !(u.banned && u.role !== "admin") ? publicUser(u) : null });
});
