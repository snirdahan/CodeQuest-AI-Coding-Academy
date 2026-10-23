import { revokeAllExtensionTokens } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { currentUser } from "@/lib/session";

export async function POST() {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    revokeAllExtensionTokens(user.id);
    return json({ ok: true });
  });
}
