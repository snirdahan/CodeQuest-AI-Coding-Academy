import type { Check, CheckContext } from "../types";

export interface CaseResult {
  ok: boolean;
  type: string;
  value: string;
  num?: number;
}

/**
 * Builds a hidden Lua harness that evaluates each expression after the learner's code ran.
 * Each expression is any Lua expression, e.g. `getRank(95)`; errors are caught per case.
 * The harness can see the learner's top-level locals and globals.
 */
export function casesHarness(fnName: string, exprs: string[]): string {
  const cases = exprs.map((e) => `function() return ${e} end`).join(",\n  ");
  return `
__cq.mute(true)
local __cases = {
  ${cases}
}
local __res = { exists = __cq.type(${fnName}) == "function", cases = {} }
if __res.exists then
  for __i = 1, #__cases do
    local __ok, __v = __cq.call(__cases[__i])
    __res.cases[__i] = { ok = __ok, type = __cq.type(__v), value = tostring(__v), num = (__cq.type(__v) == "number") and __v or nil }
  end
end
__cq.report(__res)
`;
}

export function caseAt(ctx: CheckContext, i: number): CaseResult | undefined {
  const cases = (ctx.r.cases ?? []) as CaseResult[];
  return cases[i];
}

export function functionExists(fnName: string): Check {
  return {
    label: `קיימת פונקציה בשם \`${fnName}\``,
    test: (ctx) =>
      ctx.r.exists
        ? true
        : `לא מצאתי פונקציה בשם \`${fnName}\`. ודאו שכתבתם \`function ${fnName}(...)\` בדיוק עם השם הזה (אותיות גדולות וקטנות משנות), ושהיא לא בתוך פונקציה אחרת.`,
  };
}

/** One check per hidden test case. `expect` returns true or a learner-facing hint. */
export function caseCheck(
  label: string,
  index: number,
  expect: (c: CaseResult) => true | string,
): Check {
  return {
    label,
    test: (ctx) => {
      if (!ctx.r.exists) return "הבדיקה הזו דורשת שהפונקציה תהיה קיימת.";
      const c = caseAt(ctx, index);
      if (!c) return "הבדיקה לא הצליחה לרוץ.";
      if (!c.ok) return `הפונקציה קרסה בזמן הבדיקה: ${cleanLuaError(c.value)}`;
      return expect(c);
    },
  };
}

export function expectString(expected: string, wrongHint?: (got: CaseResult) => string) {
  return (c: CaseResult): true | string => {
    if (c.type !== "string") return `ציפיתי לטקסט (string), אבל הפונקציה החזירה ${typeName(c.type)}${c.type === "nil" ? " – אולי שכחתם `return`?" : ""}.`;
    if (c.value === expected) return true;
    return wrongHint ? wrongHint(c) : `התקבל "${c.value}" – זה לא מה שציפינו כאן.`;
  };
}

export function expectNumber(expected: number, wrongHint?: (got: CaseResult) => string, tolerance = 1e-9) {
  return (c: CaseResult): true | string => {
    if (c.type !== "number") return `ציפיתי למספר, אבל הפונקציה החזירה ${typeName(c.type)}${c.type === "nil" ? " – אולי שכחתם `return`?" : ""}.`;
    if (Math.abs((c.num ?? NaN) - expected) <= tolerance) return true;
    return wrongHint ? wrongHint(c) : `התקבל ${c.value} – זה לא המספר הנכון.`;
  };
}

export function expectBoolean(expected: boolean, wrongHint?: string) {
  return (c: CaseResult): true | string => {
    if (c.type !== "boolean") return `ציפיתי ל־true או false, אבל התקבל ${typeName(c.type)} (${c.value}).`;
    if (c.value === String(expected)) return true;
    return wrongHint ?? `התקבל ${c.value} במקום ${expected}.`;
  };
}

export function typeName(t: string) {
  const names: Record<string, string> = {
    nil: "nil (כלום)",
    number: "מספר",
    string: "טקסט (string)",
    boolean: "ערך אמת (boolean)",
    table: "טבלה",
    function: "פונקציה",
  };
  return names[t] ?? t;
}

export function cleanLuaError(msg: string) {
  return msg.replace(/^main\.lua:\d+:\s*/, "");
}

export function uses(pattern: RegExp, label: string, hint: string): Check {
  return { label, test: (ctx) => (pattern.test(ctx.code) ? true : hint) };
}

export function hasOutput(): Check {
  return {
    label: "התוכנית מדפיסה משהו",
    test: (ctx) =>
      ctx.output.some((l) => l.trim().length > 0)
        ? true
        : "התוכנית רצה אבל לא הדפיסה כלום. כדי שמשהו יופיע במסך צריך לקרוא ל־`print(...)`.",
  };
}
