import { body, handle, json } from "@/lib/http";
import { checkSolution, ServiceError } from "@/lib/lesson-service";
import { extensionUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await extensionUser();
    if (!user) throw new ServiceError(401, "התוסף לא מחובר. התחברו מחדש מהאתר.");
    const { id } = await params;
    const b = await body(req);
    return json(await checkSolution(user, id, b.code, b.hintsUsed, "vscode"));
  });
}
