import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { ACHIEVEMENTS, getStats } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export default async function AchievementsPage() {
  const user = await requireUser();
  const s = getStats(user.id);
  const unlocked = new Map(s.achievements.map((a) => [a.achievement_id, a.unlocked_at]));
  return (
    <AppShell user={user} active="/achievements">
      <h1 className="text-3xl font-bold">הישגים</h1>
      <p className="mt-1 mb-8 text-slate-400">{unlocked.size} מתוך {ACHIEVEMENTS.length} נפתחו. הישגים ניתנים רק על התקדמות אמיתית.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked.get(a.id);
          return (
            <Card key={a.id} className={`flex items-center gap-4 ${at ? "" : "opacity-45 grayscale"}`}>
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${at ? "bg-gradient-to-br from-electric/30 to-violet/30" : "bg-white/5"}`}>{a.icon}</span>
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-slate-400">{a.description}</div>
                {at && <div className="mt-1 text-xs text-emerald-400">נפתח ב־{new Date(at + "Z").toLocaleDateString("he-IL")}</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
