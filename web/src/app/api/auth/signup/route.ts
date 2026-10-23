import { createUser } from "@/lib/auth";
import { track } from "@/lib/db";
import { body, handle, json } from "@/lib/http";
import { startSession } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const user = createUser(String(b.email ?? ""), String(b.password ?? ""), String(b.name ?? ""));
    await startSession(user.id);
    track(user.id, "signup");
    return json({ ok: true });
  });
}
