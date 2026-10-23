import { AppShell } from "@/components/app-shell";
import { EarlyAccessForm } from "@/components/early-access";
import { Badge, Card, LinkButton, Logo } from "@/components/ui";
import { db } from "@/lib/db";
import { hasPremium } from "@/lib/progress";
import { currentUser } from "@/lib/session";

const FREE = ["שיעורי מתחילים (שיעורים 1–5 ב־Lua)", "בדיקת קוד אוטומטית ומשוב בעברית", "מעקב התקדמות, XP, רצף והישגים", "תוסף VS Code לתרגילי מבוא", "רמזים מדורגים"];
const PREMIUM = ["כל הקורסים המלאים", "מסלולי FiveM ו־Roblox (כשייפתחו)", "פרויקטים מתקדמים", "יותר עזרה מ־CodeQuest Mentor (AI)", "תוכנית לימוד אישית", "הסברי דיבאגינג מתקדמים", "אתגרי תרגול נוספים"];

function Plans({ premiumCta }: { premiumCta: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-7">
        <h2 className="text-xl font-bold">חינם</h2>
        <div className="mt-2 text-4xl font-extrabold">₪0</div>
        <ul className="mt-6 space-y-2.5 text-slate-300">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
      </Card>
      <Card className="relative border-violet/40 bg-gradient-to-br from-electric/10 to-violet/15 p-7 shadow-2xl shadow-violet/10">
        <Badge tone="violet" className="absolute top-5 left-5">גישה מוקדמת</Badge>
        <h2 className="text-xl font-bold">💎 Premium</h2>
        <div className="mt-2 text-4xl font-extrabold">חינם <span className="text-base font-normal text-slate-400">בזמן הבטא</span></div>
        <ul className="mt-6 space-y-2.5 text-slate-200">{PREMIUM.map((f) => <li key={f}>✓ {f}</li>)}</ul>
        <div className="mt-6">{premiumCta}</div>
      </Card>
    </div>
  );
}

export default async function PricingPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Logo className="mb-10 text-xl" />
        <h1 className="mb-8 text-3xl font-bold">מחירים</h1>
        <Plans premiumCta={<LinkButton href="/signup" className="w-full" size="lg">הרשמה והצטרפות לבטא</LinkButton>} />
      </div>
    );
  }
  const joined = !!db().prepare("SELECT 1 FROM early_access WHERE user_id = ?").get(user.id) || hasPremium(user);
  return (
    <AppShell user={user} active="/pricing">
      <h1 className="text-3xl font-bold">שדרוג ל־Premium</h1>
      <p className="mt-1 mb-8 text-slate-400">אנחנו בבטא. במקום לגבות כסף כבר עכשיו, אנחנו פותחים את Premium בחינם למצטרפים מוקדמים ושואלים כמה הוא שווה לכם.</p>
      <Plans premiumCta={<EarlyAccessForm joined={joined} />} />
    </AppShell>
  );
}
