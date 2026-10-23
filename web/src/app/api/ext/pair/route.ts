import { redeemPairCode } from "@/lib/auth";
import { track } from "@/lib/db";
import { body, handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    if (typeof b.code !== "string" || !b.code) throw new ServiceError(400, "חסר קוד חיבור.");
    const { token, user } = redeemPairCode(b.code);
    track(user.id, "vscode_paired");
    return json({ token, user: { name: user.display_name, email: user.email } });
  });
}
