import { revokeExtensionToken } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { getStats } from "@/lib/progress";
import { extensionUser } from "@/lib/session";

export async function GET() {
  return handle(async () => {
    const user = await extensionUser();
    if (!user) throw new ServiceError(401, "התוסף לא מחובר. התחברו מחדש מהאתר.");
    const s = getStats(user.id);
    return json({ name: user.display_name, email: user.email, plan: user.plan, xp: s.xp, level: s.level, streak: s.streak });
  });
}

/** Disconnect: revokes the token that made this request. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) revokeExtensionToken(token);
    return json({ ok: true });
  });
}
