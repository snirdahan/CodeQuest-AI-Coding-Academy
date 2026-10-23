import type { CheckContext, Lesson } from "@/content/types";
import { runLua, type LuaRunResult } from "./lua-runner";
import { explainLuaError } from "./explain-error";

export interface CheckOutcome {
  label: string;
  passed: boolean;
  message?: string;
}

export interface GradeResult {
  passed: boolean;
  /** What the learner's program printed (the run without the hidden harness output). */
  output: string[];
  truncated: boolean;
  error?: { kind: string; line?: number; message: string; explanation: string };
  checks: CheckOutcome[];
  /** Short Hebrew summary for the top of the result panel. */
  summary: string;
}

export function stripLuaComments(src: string): string {
  return src.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, "").replace(/--[^\n]*/g, "");
}

function contextFrom(source: string, run: LuaRunResult): CheckContext {
  return {
    source,
    code: stripLuaComments(source),
    output: run.output,
    results: run.results,
    r: (run.results[0] ?? {}) as Record<string, any>,
  };
}

/**
 * Grades a Lua challenge for real: the code runs in the sandbox, then every check looks at
 * behaviour (hidden test cases, printed output) and at the learning objective (e.g. "used a loop").
 */
export async function gradeLuaLesson(lesson: Lesson, source: string): Promise<GradeResult> {
  const ch = lesson.challenge;
  const run = await runLua(source, ch.harness);

  if (run.error) {
    const explanation = explainLuaError(run.error.kind, run.error.message);
    return {
      passed: false,
      output: run.output,
      truncated: run.truncated,
      error: { ...run.error, explanation },
      checks: ch.checks.map((c) => ({ label: c.label, passed: false })),
      summary: run.error.kind === "syntax" ? "יש שגיאת כתיב בקוד, ולכן הוא לא רץ." : "הקוד התחיל לרוץ ונעצר בגלל שגיאה.",
    };
  }

  const ctx = contextFrom(source, run);
  const checks: CheckOutcome[] = [];
  for (const check of ch.checks) {
    let checkCtx = ctx;
    if (check.rerun) {
      const transformed = check.rerun.transform(source);
      if (transformed === null) {
        checkCtx = { ...ctx, results: [], r: {} };
      } else {
        const rerun = await runLua(transformed, check.rerun.harness);
        checkCtx = contextFrom(transformed, rerun);
      }
    }
    let res: true | string;
    try {
      res = check.test(checkCtx);
    } catch {
      res = "הבדיקה הזו לא הצליחה לרוץ על הקוד.";
    }
    checks.push(res === true ? { label: check.label, passed: true } : { label: check.label, passed: false, message: res });
  }

  const failed = checks.filter((c) => !c.passed).length;
  return {
    passed: failed === 0,
    output: run.output,
    truncated: run.truncated,
    checks,
    summary:
      failed === 0
        ? "כל הבדיקות עברו. עבודה מצוינת!"
        : `${checks.length - failed} מתוך ${checks.length} בדיקות עברו. עוד קצת!`,
  };
}
