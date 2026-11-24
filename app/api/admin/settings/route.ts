import { settingsCol } from "@/lib/server/db";
import { handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { sanitizeSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";
export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const s = sanitizeSettings(await readJson(req));
  await (await settingsCol()).replaceOne({ _id: "public" as any }, s as any, { upsert: true });
  return json({ settings: s });
});
