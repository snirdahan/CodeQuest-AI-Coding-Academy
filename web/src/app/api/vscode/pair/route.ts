import { createPairCode } from "@/lib/auth";
import { body, handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { currentUser } from "@/lib/session";

/** Creates a one-time pairing code and the vscode:// link that opens the exercise in the extension. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const b = await body(req);
    const code = createPairCode(user.id);
    const server = new URL(req.url).origin;
    const params = new URLSearchParams({ pair: code, server });
    if (typeof b.exercise === "string") params.set("exercise", b.exercise);
    return json({ uri: `vscode://codequest.codequest/open?${params.toString()}`, code, server });
  });
}
