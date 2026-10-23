import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui";
import { LANGUAGES } from "@/content/catalog";
import { requireUser } from "@/lib/session";

export default async function LearnPage() {
  const user = await requireUser();
  return (
    <AppShell user={user} active="/learn">
      <h1 className="text-3xl font-bold">מה לומדים היום?</h1>
      <p className="mt-1 mb-8 text-slate-400">בחרו שפת תכנות. שפות שמסומנות &quot;בקרוב&quot; נמצאות בתוכנית העבודה ועוד לא פתוחות.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LANGUAGES.map((l, i) => {
          const playable = l.status !== "planned";
          const inner = (
            <div
              className={`glass group relative h-full overflow-hidden rounded-2xl p-6 transition duration-300 animate-fade-up ${playable ? "hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-violet/10" : "opacity-60"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute -top-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-br ${l.color} opacity-20 blur-2xl transition group-hover:opacity-40`} />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${l.color} text-2xl shadow-lg`}>{l.glyph}</span>
                  <StatusBadge status={l.status} />
                </div>
                <h2 className="text-2xl font-bold" dir="ltr" style={{ textAlign: "right" }}>{l.name}</h2>
                <p className="mt-1 text-slate-400">{l.tagline}</p>
                {l.tracks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {l.tracks.map((t) => (
                      <span key={t.id} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">{t.title}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
          return playable ? <Link key={l.id} href={`/learn/${l.id}`}>{inner}</Link> : <div key={l.id}>{inner}</div>;
        })}
      </div>
    </AppShell>
  );
}
