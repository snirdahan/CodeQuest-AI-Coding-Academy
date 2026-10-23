import { body, handle, json } from "@/lib/http";
import { loadAccessibleLesson, ServiceError } from "@/lib/lesson-service";
import { recordHintUsed } from "@/lib/progress";
import { currentUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const { id } = await params;
    const lesson = loadAccessibleLesson(user, id);
    const b = await body(req);
    recordHintUsed(user.id, lesson, Number(b.count) || 0);
    return json({ ok: true });
  });
}
