import { authenticate } from "@/lib/auth";
import { body, handle, json } from "@/lib/http";
import { startSession } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = authenticate(String(b.email ?? ""), String(b.password ?? ""));
    await startSession(user.id);
    return json({ ok: true });
  });
}
