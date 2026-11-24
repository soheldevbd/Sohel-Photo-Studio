import { handle, json } from "@/lib/server/http";
import { getSettings } from "@/lib/server/settings";
export const dynamic = "force-dynamic";
export const GET = handle(async () => json(await getSettings()));
