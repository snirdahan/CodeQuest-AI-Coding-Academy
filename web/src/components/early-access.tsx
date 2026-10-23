"use client";

import { useState } from "react";
import { Button } from "./ui";

const PRICES = [19, 29, 39, 49];

export function EarlyAccessForm({ joined }: { joined: boolean }) {
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(joined ? "done" : "idle");

  if (state === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
        ✓ אתם ברשימת הגישה המוקדמת, וכל שיעורי ה־Premium פתוחים לכם בחינם לאורך הבטא. לא נגבה מכם כסף בלי אישור מפורש שלכם.
      </div>
    );
  }

  async function submit() {
    if (price === null) return;
    setState("busy");
    const res = await fetch("/api/early-access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ price, note }) });
    if (res.ok) {
      setState("done");
      setTimeout(() => window.location.reload(), 900);
    } else setState("error");
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-300">כמה הייתם מוכנים לשלם בחודש על Premium, כשייצא מהבטא?</div>
      <div className="flex flex-wrap gap-2">
        {PRICES.map((p) => (
          <button key={p} onClick={() => setPrice(p)} className={`rounded-xl border px-4 py-2 text-sm transition ${price === p ? "border-violet bg-violet/20 text-white" : "border-white/10 text-slate-300 hover:border-white/30"}`}>
            ₪{p}
          </button>
        ))}
        <button onClick={() => setPrice(0)} className={`rounded-xl border px-4 py-2 text-sm transition ${price === 0 ? "border-violet bg-violet/20 text-white" : "border-white/10 text-slate-300 hover:border-white/30"}`}>
          לא הייתי משלם
        </button>
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="(לא חובה) מה הכי חשוב לכם שיהיה ב־Premium?" className="w-full rounded-xl border border-white/10 bg-ink-900 p-3 text-sm outline-none focus:border-electric/60" rows={2} />
      <Button onClick={submit} disabled={price === null || state === "busy"} className="w-full" size="lg">
        {state === "busy" ? "רגע..." : "הצטרפות לגישה מוקדמת (חינם בבטא)"}
      </Button>
      {state === "error" && <p className="text-sm text-red-300">משהו השתבש, נסו שוב.</p>}
      <p className="text-xs text-slate-500">אין כאן תשלום. התשובה שלכם עוזרת לנו לקבוע מחיר הוגן.</p>
    </div>
  );
}
