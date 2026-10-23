"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { CheckResponse, publicExercise } from "@/lib/lesson-service";
import { CodeEditor } from "./code-editor";
import { CodeBlock, RichText } from "./rich-text";
import { Button, Card, LinkButton } from "./ui";

type Exercise = ReturnType<typeof publicExercise>;

function Quiz({ lessonId, quiz, done }: { lessonId: string; quiz: { question: string; code?: string; options: string[] }; done: boolean }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [answer, setAnswer] = useState<{ correct: boolean; why: string; xpAwarded: number } | null>(null);
  const [solved, setSolved] = useState(done);
  const router = useRouter();

  async function choose(i: number) {
    setPicked(i);
    const res = await fetch(`/api/lessons/${lessonId}/quiz`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option: i }) });
    const j = await res.json();
    setAnswer(j);
    if (j.correct) {
      setSolved(true);
      if (j.xpAwarded > 0) router.refresh();
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">❓ שאלה קצרה</h2>
      <Card className="space-y-4">
        <p className="font-medium text-slate-100"><RichText text={quiz.question} /></p>
        {quiz.code && <CodeBlock code={quiz.code} caption="הקוד" />}
        <div className="grid gap-2">
          {quiz.options.map((o, i) => {
            const isPicked = picked === i;
            const tone = isPicked && answer ? (answer.correct ? "border-emerald-500/60 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10") : "border-white/10 hover:border-white/30 hover:bg-white/5";
            return (
              <button key={i} onClick={() => choose(i)} disabled={answer?.correct} className={`rounded-xl border px-4 py-3 text-start transition ${tone}`}>
                <RichText text={o} />
              </button>
            );
          })}
        </div>
        {answer && (
          <div className={`animate-pop rounded-xl p-4 text-sm ${answer.correct ? "bg-emerald-500/10 text-emerald-100" : "bg-amber-500/10 text-amber-100"}`}>
            <div className="mb-1 font-semibold">{answer.correct ? "✓ נכון!" : "לא בדיוק – נסו שוב"} {answer.xpAwarded > 0 && <span dir="ltr">+{answer.xpAwarded} XP</span>}</div>
            <RichText text={answer.why} />
          </div>
        )}
        {solved && !answer && <p className="text-sm text-emerald-300">✓ כבר עניתם נכון על השאלה הזו.</p>}
      </Card>
    </section>
  );
}

export function LessonClient({
  exercise,
  quiz,
  quizDone,
  hintsUsed: initialHints,
  instructions,
}: {
  exercise: Exercise;
  quiz: { question: string; code?: string; options: string[] };
  quizDone: boolean;
  hintsUsed: number;
  instructions: ReactNode;
}) {
  const [code, setCode] = useState(exercise.lastCode ?? exercise.starterCode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState(Math.min(initialHints, exercise.hints.length));
  const [solution, setSolution] = useState<{ solution: string; explanation: string } | null>(null);
  const [solutionAvailable, setSolutionAvailable] = useState(exercise.completed || exercise.attempts >= 3);
  const [completed, setCompleted] = useState(exercise.completed);
  const [vsBusy, setVsBusy] = useState(false);
  const router = useRouter();

  async function check() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${exercise.id}/check`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, hintsUsed: hints }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "הבדיקה נכשלה");
      setResult(j);
      setSolutionAvailable(j.solutionAvailable);
      if (j.passed) setCompleted(true);
      // Re-render server parts (XP / level / streak in the header) without losing editor state.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "הבדיקה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function nextHint() {
    const n = Math.min(hints + 1, exercise.hints.length);
    setHints(n);
    fetch(`/api/lessons/${exercise.id}/hint`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ count: n }) });
  }

  async function showSolution() {
    const res = await fetch(`/api/lessons/${exercise.id}/solution`);
    const j = await res.json();
    if (res.ok) setSolution(j);
    else setError(j.error);
  }

  async function openInVsCode() {
    setVsBusy(true);
    const res = await fetch("/api/vscode/pair", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ exercise: exercise.id }) });
    const j = await res.json();
    setVsBusy(false);
    if (res.ok) window.location.href = j.uri;
  }

  const r = result;
  return (
    <>
      <Quiz lessonId={exercise.id} quiz={quiz} done={quizDone} />

      <section className="space-y-4">
        <h2 className="text-xl font-bold">⌨️ אתגר קוד</h2>
        <Card>{instructions}</Card>

        <CodeEditor value={code} onChange={setCode} onRun={check} errorLine={r?.error?.line ?? null} fileName={exercise.fileName} />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={check} disabled={busy} size="lg" data-testid="check-button">
            {busy ? "בודק..." : "▶ בדיקה"}
          </Button>
          <Button variant="secondary" onClick={nextHint} disabled={hints >= exercise.hints.length}>
            💡 {hints === 0 ? "רמז" : hints >= exercise.hints.length ? "אין עוד רמזים" : "רמז נוסף"}
          </Button>
          <Button variant="secondary" onClick={openInVsCode} disabled={vsBusy}>🧩 תרגל ב־VS Code</Button>
          <Button variant="ghost" onClick={() => { setCode(exercise.starterCode); setResult(null); }}>↺ התחלה מחדש</Button>
        </div>

        {hints > 0 && (
          <Card className="space-y-2 border-amber-500/20 bg-amber-500/5">
            {exercise.hints.slice(0, hints).map((h, i) => (
              <div key={i} className="animate-fade-up text-sm text-amber-100"><span className="font-semibold">רמז {i + 1}:</span> <RichText text={h} /></div>
            ))}
          </Card>
        )}

        {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

        {r && (
          <div data-testid="result" className="animate-fade-up space-y-4">
            <Card className={r.passed ? "border-emerald-500/40 bg-emerald-500/10" : r.error ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}>
              <div className="text-lg font-semibold">{r.passed ? "🎉 " : r.error ? "🛑 " : "🔍 "}{r.summary}</div>
              {r.error && (
                <div className="mt-3 space-y-2">
                  <div className="text-slate-200"><RichText text={r.error.explanation} /></div>
                  <div className="rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-red-300" dir="ltr">
                    {r.error.line ? `line ${r.error.line}: ` : ""}{r.error.message}
                  </div>
                </div>
              )}
              {!r.error && (
                <ul className="mt-3 space-y-2">
                  {r.checks.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className={c.passed ? "text-emerald-300" : "text-amber-200"}>{c.passed ? "✓" : "✗"} <RichText text={c.label} /></span>
                      {c.message && <div className="ms-5 mt-0.5 text-slate-300"><RichText text={c.message} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {(r.output.length > 0 || r.truncated) && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <div className="border-b border-white/5 px-4 py-2 text-xs text-slate-500">פלט התוכנית שלכם</div>
                <pre className="max-h-60 overflow-auto p-4 font-mono text-sm text-emerald-300" dir="ltr">{r.output.join("\n")}{r.truncated ? "\n… (הפלט קוצר)" : ""}</pre>
              </div>
            )}

            {r.passed && (
              <Card className="animate-pop border-violet/40 bg-gradient-to-l from-electric/15 to-violet/20 text-center">
                {r.reward.xpAwarded > 0 ? (
                  <div className="text-3xl font-extrabold text-gradient" dir="ltr">+{r.reward.xpAwarded} XP</div>
                ) : (
                  <div className="text-slate-300">כבר קיבלתם XP על התרגיל הזה – ה־XP ניתן פעם אחת לכל אתגר.</div>
                )}
                {r.reward.levelAfter > r.reward.levelBefore && <div className="mt-1 text-lg font-bold">⬆️ עליתם לרמה {r.reward.levelAfter}!</div>}
                {r.reward.newAchievements.map((a) => (
                  <div key={a.id} className="mt-2 text-sm">{a.icon} הישג חדש: <b>{a.title}</b> – {a.description}</div>
                ))}
                <div className="mt-4 flex justify-center gap-3">
                  {r.nextLessonId ? <LinkButton href={`/lesson/${r.nextLessonId}`} size="lg">לשיעור הבא: {r.nextLessonTitle} ←</LinkButton> : <LinkButton href="/dashboard" size="lg">חזרה לדשבורד</LinkButton>}
                </div>
              </Card>
            )}
          </div>
        )}

        {!completed && !solutionAvailable && (r?.reward.attempts ?? exercise.attempts) > 0 && (
          <p className="text-xs text-slate-500">ההסבר המלא עם הפתרון ייפתח אחרי 3 ניסיונות. בינתיים – הרמזים הם החבר הכי טוב שלכם.</p>
        )}
        {solutionAvailable && !solution && (
          <Button variant="ghost" onClick={showSolution}>📘 הצגת פתרון לדוגמה והסבר</Button>
        )}
        {solution && (
          <Card className="space-y-3">
            <div className="font-semibold">פתרון לדוגמה</div>
            <CodeBlock code={solution.solution} caption="אחת הדרכים לפתור" />
            <p className="text-sm text-slate-300"><RichText text={solution.explanation} /></p>
          </Card>
        )}
        {completed && !r?.passed && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
            <span>✓ כבר פתרתם את האתגר הזה.</span>
            {exercise.nextLessonId && <Link href={`/lesson/${exercise.nextLessonId}`} className="text-blue-300 hover:underline">לשיעור הבא ←</Link>}
          </div>
        )}
      </section>
    </>
  );
}
