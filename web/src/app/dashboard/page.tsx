import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, LinkButton, ProgressBar } from "@/components/ui";
import { ALL_COURSES, getCourse, getLesson } from "@/content/catalog";
import { ACHIEVEMENTS, getStats, recommendedLesson } from "@/lib/progress";
import { requireUser } from "@/lib/session";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jerusalem" }).format(new Date()));
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 18) return "צהריים טובים";
  return "ערב טוב";
}

export default async function Dashboard() {
  const user = await requireUser();
  const s = getStats(user.id);
  const next = recommendedLesson(user);
  const recent = s.achievements.slice(0, 3).map((a) => ACHIEVEMENTS.find((d) => d.id === a.achievement_id)!).filter(Boolean);
  const lastTouched = [...s.progress.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  const continueLesson = lastTouched && !lastTouched.challenge_done ? getLesson(lastTouched.lesson_id) : next;
  const active = ALL_COURSES.filter((c) => c.lessons.some((l) => s.progress.has(l.id)));
  const courses = active.length ? active : [getCourse("lua-basics")!];

  return (
    <AppShell user={user} active="/dashboard">
      <div className="animate-fade-up space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{greeting()}, {user.display_name} 👋</h1>
          <p className="mt-1 text-slate-400">
            {s.activeToday ? "כבר כתבתם קוד היום – הרצף שלכם בטוח." : s.streak > 0 ? `יש לכם רצף של ${s.streak} ימים. תרגיל אחד היום שומר עליו.` : "תרגיל אחד היום מתחיל רצף חדש."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-sm text-slate-400">רצף ימים</div>
            <div className="mt-1 flex items-baseline gap-2 text-3xl font-bold">🔥 {s.streak}</div>
          </Card>
          <Card>
            <div className="text-sm text-slate-400">סה״כ XP</div>
            <div className="mt-1 text-3xl font-bold" dir="ltr">⚡ {s.xp}</div>
          </Card>
          <Card>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>רמה נוכחית</span>
              <span dir="ltr">{s.nextLevelXp - s.xp} XP לרמה הבאה</span>
            </div>
            <div className="mt-1 text-3xl font-bold">רמה {s.level}</div>
            <ProgressBar className="mt-3" value={s.xp - s.levelStartXp} max={s.nextLevelXp - s.levelStartXp} />
          </Card>
        </div>

        {continueLesson && (
          <Card className="relative overflow-hidden bg-gradient-to-l from-electric/15 to-violet/15 p-6">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge tone="violet">{lastTouched && !lastTouched.challenge_done ? "המשך מאיפה שעצרתם" : "השיעור המומלץ הבא"}</Badge>
                <h2 className="mt-2 text-2xl font-bold">{continueLesson.title}</h2>
                <p className="text-slate-300">{getCourse(continueLesson.courseId)?.title} · {continueLesson.summary} · כ־{continueLesson.minutes} דקות · <span dir="ltr">+{continueLesson.xp} XP</span></p>
              </div>
              <LinkButton href={`/lesson/${continueLesson.id}`} size="lg">המשך ללמוד ←</LinkButton>
            </div>
          </Card>
        )}
        {!continueLesson && (
          <Card className="p-6">
            <h2 className="text-xl font-bold">סיימתם את כל השיעורים הזמינים 🎉</h2>
            <p className="text-slate-400">מסלולי FiveM ו־HTML/CSS בדרך. נעדכן אתכם כשהם ייפתחו.</p>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">הקורסים שלכם</h2>
            {courses.map((c) => {
              const done = c.lessons.filter((l) => s.progress.get(l.id)?.challenge_done).length;
              return (
                <Link key={c.id} href={`/course/${c.id}`} className="block">
                  <Card className="transition hover:-translate-y-0.5 hover:border-electric/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-sm text-slate-400">{c.description}</div>
                      </div>
                      <span className="text-sm text-slate-400">{done}/{c.lessons.length}</span>
                    </div>
                    <ProgressBar value={done} max={c.lessons.length} />
                  </Card>
                </Link>
              );
            })}
            <Link href="/learn" className="inline-block text-sm text-blue-300 hover:underline">לכל השפות והמסלולים ←</Link>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">הישגים אחרונים</h2>
            <Card className="space-y-3">
              {recent.length === 0 && <p className="text-sm text-slate-400">עוד אין הישגים. הריצו את הקוד הראשון שלכם כדי לפתוח את הראשון!</p>}
              {recent.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/15 text-xl">{a.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.description}</div>
                  </div>
                </div>
              ))}
              <Link href="/achievements" className="block text-sm text-blue-300 hover:underline">כל ההישגים ←</Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
