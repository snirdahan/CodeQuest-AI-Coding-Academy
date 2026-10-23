import { ALL_COURSES } from "@/content/catalog";
import { handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { lessonAccess, progressMap } from "@/lib/progress";
import { extensionUser } from "@/lib/session";

export async function GET() {
  return handle(async () => {
    const user = await extensionUser();
    if (!user) throw new ServiceError(401, "התוסף לא מחובר. התחברו מחדש מהאתר.");
    const progress = progressMap(user.id);
    return json({
      courses: ALL_COURSES.map((c) => ({
        id: c.id,
        title: c.title,
        lessons: c.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          completed: !!progress.get(l.id)?.challenge_done,
          access: lessonAccess(user, l, progress),
        })),
      })),
    });
  });
}
