import Link from "next/link";
import { CodeBlock } from "@/components/rich-text";
import { Badge, Card, LinkButton, Logo, StatusBadge } from "@/components/ui";
import { LANGUAGES } from "@/content/catalog";
import { currentUser } from "@/lib/session";

export default async function Landing() {
  const user = await currentUser();
  return (
    <div className="mx-auto max-w-6xl px-4">
      <header className="flex items-center justify-between py-6">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-2">
          <Link href="/pricing" className="hidden px-3 text-sm text-slate-400 hover:text-white sm:block">מחירים</Link>
          {user ? (
            <LinkButton href="/dashboard" size="sm">לדשבורד</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">התחברות</LinkButton>
              <LinkButton href="/signup" size="sm">הרשמה בחינם</LinkButton>
            </>
          )}
        </nav>
      </header>

      <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <Badge tone="violet" className="mb-5">בטא פתוחה · Lua זמין עכשיו</Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            לומדים לתכנת
            <br />
            <span className="text-gradient">כמו במשחק.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            כותבים קוד אמיתי, מריצים אותו, ומקבלים משוב ברור בעברית על כל טעות. צוברים XP, עולים ברמות, ובונים כישורים שעובדים גם מחוץ לאפליקציה –
            ב־FiveM, ב־Roblox ובאתרים.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={user ? "/dashboard" : "/signup"} size="lg">מתחילים בחינם ←</LinkButton>
            <LinkButton href="#how" variant="secondary" size="lg">איך זה עובד?</LinkButton>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <Card className="p-3 shadow-2xl shadow-violet/10">
            <CodeBlock caption="שיעור 5 · תנאים" code={'function getRank(score)\n  if score >= 90 then\n    return "A"\n  elseif score >= 75 then\n    return "B"\n  end\n  return "F"\nend'} />
            <div className="mt-3 space-y-2 rounded-xl bg-black/20 p-4 text-sm">
              <div className="flex items-center gap-2 text-emerald-300">✓ ציון 90 (גבול) → A</div>
              <div className="flex items-center gap-2 text-emerald-300">✓ ציון 75 (גבול) → B</div>
              <div className="flex items-start gap-2 text-amber-200">✗ ציון 60 → C <span className="text-slate-400">– חסר מקרה בין 60 ל־74. מה צריך להחזיר שם?</span></div>
            </div>
          </Card>
          <p className="mt-2 text-center text-xs text-slate-500">דוגמה למשוב שהבודק האוטומטי נותן</p>
        </div>
      </section>

      <section id="how" className="py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">איך זה עובד</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "📖", title: "לומדים בקצרה", text: "הסבר קצר בעברית פשוטה ודוגמאות קוד אמיתיות שאפשר להריץ." },
            { icon: "⌨️", title: "כותבים קוד אמיתי", text: "בדפדפן או ב־Visual Studio Code דרך התוסף שלנו. הקוד רץ באמת בסביבה מבודדת." },
            { icon: "🎯", title: "מקבלים משוב ו־XP", text: "בודק אוטומטי בודק התנהגות ולא רק טקסט, מסביר טעויות ונותן רמזים – בלי לגלות את התשובה." },
          ].map((s) => (
            <Card key={s.title} className="p-6">
              <div className="mb-3 text-3xl">{s.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-slate-400">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16">
        <h2 className="mb-3 text-center text-3xl font-bold">מסלולים</h2>
        <p className="mb-10 text-center text-slate-400">אנחנו מסמנים בכנות מה כבר זמין ומה עוד בדרך.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.flatMap((l) => l.tracks).map((t) => (
            <Card key={t.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{t.icon}</span>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="text-lg font-semibold">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 text-center">
        <Card className="mx-auto max-w-3xl bg-gradient-to-br from-electric/10 to-violet/10 p-10">
          <h2 className="text-3xl font-bold">השיעור הראשון לוקח 5 דקות</h2>
          <p className="mt-3 text-slate-400">חינם. בלי כרטיס אשראי. בלי להתקין כלום.</p>
          <LinkButton href={user ? "/dashboard" : "/signup"} size="lg" className="mt-6">כתבו את שורת הקוד הראשונה שלכם</LinkButton>
        </Card>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 py-8 text-sm text-slate-500">
        <Logo />
        <span>Lua, Luau, FiveM ו־Roblox הם סימנים של בעליהם. CodeQuest אינו קשור אליהם רשמית.</span>
      </footer>
    </div>
  );
}
