import { handle, json } from "@/lib/http";
import { loadAccessibleLesson, publicExercise, ServiceError } from "@/lib/lesson-service";
import { extensionUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await extensionUser();
    if (!user) throw new ServiceError(401, "התוסף לא מחובר. התחברו מחדש מהאתר.");
    const { id } = await params;
    return json(publicExercise(user, loadAccessibleLesson(user, id)));
  });
}
