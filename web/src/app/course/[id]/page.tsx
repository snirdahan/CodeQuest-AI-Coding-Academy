import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getCourse, getTrack } from "@/content/catalog";
import { lessonAccess, progressMap } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();
  const track = getTrack(course.trackId)!;
  const progress = progressMap(user.id);
  const done = course.lessons.filter((l) => progress.get(l.id)?.challenge_done).length;

  return (
    <AppShell user={user} active="/learn">
      <Link href={`/learn/${track.languageId}`} className="text-sm text-slate-400 hover:text-white">→ {track.title}</Link>
      <div className="mt-2 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-1 text-slate-400">{course.description}</p>
        </div>
        <div className="w-56">
          <div className="mb-1 text-sm text-slate-400">{done} מתוך {course.lessons.length} הושלמו</div>
          <ProgressBar value={done} max={course.lessons.length} />
        </div>
      </div>
      <ol className="relative space-y-3 border-s-2 border-white/5 ps-6">
        {course.lessons.map((l, i) => {
          const p = progress.get(l.id);
          const access = lessonAccess(user, l, progress);
          const completed = !!p?.challenge_done;
          const dot = completed ? "bg-emerald-500 text-white" : access === "open" ? "bg-gradient-to-br from-electric to-violet text-white ring-4 ring-violet/20" : "bg-ink-700 text-slate-500";
          const content = (
            <Card className={`flex items-center gap-4 transition ${access === "open" ? "hover:-translate-y-0.5 hover:border-electric/30" : "opacity-60"}`}>
              <span className={`absolute -start-[1.05rem] grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${dot}`}>{completed ? "✓" : i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{l.title}</span>
                  {l.premium && <Badge tone="violet">💎 Premium</Badge>}
                  {completed && <Badge tone="green">הושלם</Badge>}
                </div>
                <div className="text-sm text-slate-400">{l.summary} · כ־{l.minutes} דק׳</div>
              </div>
              <div className="text-sm text-slate-400" dir="ltr">+{l.xp} XP</div>
              <div className="w-28 text-left text-sm">
                {access === "open" ? <span className="text-blue-300">{completed ? "לחזור ←" : "להתחיל ←"}</span> : access === "locked-premium" ? <span className="text-violet-300">🔒 Premium</span> : <span className="text-slate-500">🔒 נעול</span>}
              </div>
            </Card>
          );
          return (
            <li key={l.id} className="relative">
              {access === "open" ? <Link href={`/lesson/${l.id}`}>{content}</Link> : access === "locked-premium" ? <Link href="/pricing">{content}</Link> : content}
            </li>
          );
        })}
      </ol>
      {course.lessons.some((l) => l.premium) && (
        <p className="mt-6 text-sm text-slate-500">שיעורים 🔒 &quot;נעול&quot; נפתחים כשמסיימים את השיעור שלפניהם. שיעורי 💎 Premium פתוחים בחינם בזמן הבטא למי שמצטרף לגישה המוקדמת.</p>
      )}
    </AppShell>
  );
}
