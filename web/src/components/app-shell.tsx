import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRow } from "@/lib/db";
import { getStats, hasPremium } from "@/lib/progress";
import { LogoutButton } from "./logout-button";
import { Logo, ProgressBar } from "./ui";

const NAV = [
  { href: "/dashboard", label: "דשבורד", icon: "🏠" },
  { href: "/learn", label: "קורסים", icon: "📚" },
  { href: "/achievements", label: "הישגים", icon: "🏅" },
  { href: "/connect-vscode", label: "VS Code", icon: "🧩" },
  { href: "/pricing", label: "Premium", icon: "💎" },
];

export function AppShell({ user, active, children }: { user: UserRow; active: string; children: ReactNode }) {
  const s = getStats(user.id);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-white/5 bg-ink-900/60 p-4 backdrop-blur lg:flex">
        <Link href="/dashboard" className="mb-8 px-2 pt-2 text-xl"><Logo /></Link>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active === n.href ? "bg-gradient-to-l from-electric/20 to-violet/20 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="glass rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>רמה {s.level}</span>
              <span dir="ltr">{s.xp - s.levelStartXp}/{s.nextLevelXp - s.levelStartXp} XP</span>
            </div>
            <ProgressBar value={s.xp - s.levelStartXp} max={s.nextLevelXp - s.levelStartXp} />
          </div>
          <div className="px-3 text-sm">
            <div className="font-medium text-slate-200">{user.display_name}</div>
            <div className="text-xs text-slate-500">{hasPremium(user) ? (user.plan === "beta_premium" ? "Premium (בטא)" : "Premium") : "חשבון חינמי"}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/5 bg-ink-950/70 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="lg:hidden"><Logo /></Link>
          <div className="ms-auto flex items-center gap-1.5 whitespace-nowrap text-xs sm:gap-2 sm:text-sm">
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1" title="רצף ימים">
              <span aria-hidden>🔥</span><span className="font-semibold">{s.streak}</span>
            </span>
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1" title="נקודות ניסיון">
              <span aria-hidden>⚡</span><span className="font-semibold" dir="ltr">{s.xp} XP</span>
            </span>
            <span className="flex items-center rounded-full bg-gradient-to-l from-electric to-violet px-3 py-1 font-semibold text-white">רמה {s.level}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24 lg:px-8 lg:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/5 bg-ink-900/90 py-2 backdrop-blur lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 px-2 text-[11px] ${active === n.href ? "text-white" : "text-slate-500"}`}>
              <span aria-hidden className="text-lg">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
