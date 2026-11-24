import { payments } from "@/lib/server/db";
import { handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { pubPay } from "@/lib/server/pay";

export const dynamic = "force-dynamic";
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const list = await (await payments()).find({}).sort({ createdAt: -1 }).limit(500).toArray();
  return json({ payments: list.map(pubPay) });
});
