import { listExtensionTokens } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { getStats } from "@/lib/progress";
import { currentUser } from "@/lib/session";

export async function GET() {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const s = getStats(user.id);
    return json({
      name: user.display_name,
      plan: user.plan,
      xp: s.xp,
      level: s.level,
      streak: s.streak,
      completed: [...s.progress.values()].filter((p) => p.challenge_done).map((p) => ({ lesson: p.lesson_id, via: p.completed_via })),
      achievements: s.achievements.map((a) => a.achievement_id),
      vscodeConnections: listExtensionTokens(user.id).length,
    });
  });
}
