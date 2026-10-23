import { handle, json } from "@/lib/http";
import { endSession } from "@/lib/session";

export async function POST() {
  return handle(async () => {
    await endSession();
    return json({ ok: true });
  });
}
