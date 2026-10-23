import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, LinkButton, ProgressBar, StatusBadge } from "@/components/ui";
import { getLanguage } from "@/content/catalog";
import { progressMap } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export default async function LanguagePage({ params }: { params: Promise<{ lang: string }> }) {
  const user = await requireUser();
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) notFound();
  const progress = progressMap(user.id);

  return (
    <AppShell user={user} active="/learn">
      <Link href="/learn" className="text-sm text-slate-400 hover:text-white">→ כל השפות</Link>
      <h1 className="mt-2 text-3xl font-bold"><span dir="ltr">{language.name}</span> – בחרו מסלול</h1>
      <p className="mt-1 mb-8 text-slate-400">{language.tagline}</p>
      <div className="grid gap-5 lg:grid-cols-3">
        {language.tracks.map((t, i) => (
          <Card key={t.id} className="flex animate-fade-up flex-col gap-4 p-6" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-4xl">{t.icon}</span>
              <div className="flex gap-1.5">
                {t.premium && <Badge tone="violet">💎 Premium</Badge>}
                <StatusBadge status={t.status} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.title}</h2>
              <div className="text-sm text-blue-300">{t.subtitle}</div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{t.description}</p>
            {t.environmentNote && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">🖥️ {t.environmentNote}</p>
            )}
            {t.courses.map((c) => {
              const done = c.lessons.filter((l) => progress.get(l.id)?.challenge_done).length;
              return (
                <div key={c.id} className="mt-auto space-y-3">
                  <div className="flex justify-between text-sm"><span>{c.title}</span><span className="text-slate-400">{done}/{c.lessons.length} שיעורים</span></div>
                  <ProgressBar value={done} max={c.lessons.length} />
                  <LinkButton href={`/course/${c.id}`} className="w-full">{done > 0 ? "המשך" : "התחלה"}</LinkButton>
                </div>
              );
            })}
            {t.courses.length === 0 && t.roadmap && (
              <div className="mt-auto">
                <div className="mb-2 text-xs font-medium text-slate-500">מה ייכלל במסלול:</div>
                <ul className="space-y-1 text-sm text-slate-400">
                  {t.roadmap.map((r) => <li key={r}>○ {r}</li>)}
                </ul>
                <div className="mt-4 rounded-lg bg-white/5 py-2 text-center text-sm text-slate-400">עוד לא זמין – בפיתוח</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
