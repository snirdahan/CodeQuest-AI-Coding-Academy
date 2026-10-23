"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "משהו השתבש. נסו שוב.");
      setBusy(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  }

  const input = "w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-electric/60 focus:ring-2 focus:ring-electric/20";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <label className="block space-y-1.5">
          <span className="text-sm text-slate-400">איך לקרוא לכם?</span>
          <input name="name" required maxLength={40} className={input} placeholder="השם שיופיע באפליקציה" autoComplete="nickname" />
        </label>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm text-slate-400">אימייל</span>
        <input name="email" type="email" required dir="ltr" className={input} placeholder="you@example.com" autoComplete="email" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-slate-400">סיסמה</span>
        <input name="password" type="password" required minLength={mode === "signup" ? 8 : 1} dir="ltr" className={input} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        {mode === "signup" && <span className="text-xs text-slate-500">לפחות 8 תווים</span>}
      </label>
      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "רגע..." : mode === "signup" ? "יצירת חשבון והתחלה" : "התחברות"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        {mode === "signup" ? (
          <>כבר יש לכם חשבון? <Link href="/login" className="text-blue-300 hover:underline">התחברות</Link></>
        ) : (
          <>אין לכם חשבון? <Link href="/signup" className="text-blue-300 hover:underline">הרשמה בחינם</Link></>
        )}
      </p>
    </form>
  );
}
