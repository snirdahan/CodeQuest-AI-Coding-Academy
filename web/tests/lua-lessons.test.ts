import { describe, expect, it } from "vitest";
import { luaBasics } from "@/content/lua/lua-basics";
import { getLesson } from "@/content/catalog";
import { gradeLuaLesson } from "@/lib/grading/grade";

// Real grading tests: every reference solution must pass, every untouched starter must fail.
describe("Lua basics course – reference solutions", () => {
  for (const lesson of luaBasics.lessons) {
    it(`${lesson.id}: solution passes all checks`, async () => {
      const r = await gradeLuaLesson(lesson, lesson.challenge.solution);
      const failed = r.checks.filter((c) => !c.passed);
      expect(r.error, JSON.stringify(r.error)).toBeUndefined();
      expect(failed, JSON.stringify(failed)).toEqual([]);
      expect(r.passed).toBe(true);
    });
    it(`${lesson.id}: starter code does not pass`, async () => {
      const r = await gradeLuaLesson(lesson, lesson.challenge.starterCode);
      expect(r.passed).toBe(false);
    });
  }
});

const L = (id: string) => getLesson(id)!;

describe("behaviour-based feedback on typical mistakes", () => {
  it("variables: printing the literal name instead of the variable is explained", async () => {
    const r = await gradeLuaLesson(L("lua-02-variables"), 'local username = "snir"\nprint("username")');
    expect(r.passed).toBe(false);
    const msg = r.checks.find((c) => c.label.includes("הודפס"))!.message!;
    expect(msg).toContain("מירכאות");
  });

  it("variables: any username is accepted (not exact text matching)", async () => {
    const r = await gradeLuaLesson(L("lua-02-variables"), "local username = 'דנה_99'\nprint('My name: ' .. username)");
    expect(r.passed).toBe(true);
  });

  it("variables: wrong capitalisation gets a specific explanation", async () => {
    const r = await gradeLuaLesson(L("lua-02-variables"), 'local userName = "snir"\nprint(userName)');
    expect(r.passed).toBe(false);
    expect(r.checks[0].message).toContain("אותיות גדולות וקטנות");
  });

  it("numbers: hard-coded answer is rejected by the re-run with other prices", async () => {
    const src = "local price = 25\nlocal quantity = 4\nlocal discount = 10\nlocal total = 90\nprint(total)";
    const r = await gradeLuaLesson(L("lua-03-numbers"), src);
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.label.includes("מחירים אחרים"))!.passed).toBe(false);
  });

  it("numbers: adding the discount instead of subtracting is explained", async () => {
    const src = "local price = 25\nlocal quantity = 4\nlocal discount = 10\nlocal total = price * quantity + discount\nprint(total)";
    const r = await gradeLuaLesson(L("lua-03-numbers"), src);
    expect(r.checks.find((c) => c.label === "החישוב נכון")!.message).toContain("110");
  });

  it("strings: using + gives a Hebrew explanation about ..", async () => {
    const src = 'local player = "Nova"\nlocal level = 7\nlocal message = "Player " + player\nprint(message)';
    const r = await gradeLuaLesson(L("lua-04-strings"), src);
    expect(r.error?.kind).toBe("runtime");
    expect(r.error?.line).toBe(3);
    expect(r.error?.explanation).toContain("..");
  });

  it("conditions: > instead of >= fails the boundary case with a hint", async () => {
    const src = 'function getRank(s)\n if s > 90 then return "A" elseif s >= 75 then return "B" elseif s >= 60 then return "C" else return "F" end\nend';
    const r = await gradeLuaLesson(L("lua-05-conditions"), src);
    expect(r.passed).toBe(false);
    const boundary = r.checks.find((c) => c.label.includes("90"))!;
    expect(boundary.passed).toBe(false);
    expect(boundary.message).toContain(">=");
  });

  it("conditions: missing end is a syntax error with line and explanation", async () => {
    const r = await gradeLuaLesson(L("lua-05-conditions"), 'function getRank(s)\n  if s >= 90 then\n    return "A"\nend');
    expect(r.error?.kind).toBe("syntax");
    expect(r.error?.explanation).toContain("end");
  });

  it("loops: an infinite loop is stopped and explained", async () => {
    const r = await gradeLuaLesson(L("lua-06-loops"), "function sumTo(n)\n  local i = 1\n  while i <= n do end\n  return 0\nend\nprint(sumTo(3))");
    expect(r.error?.kind).toBe("timeout");
  });

  it("loops: closed formula passes behaviour but fails the learning objective", async () => {
    const r = await gradeLuaLesson(L("lua-06-loops"), "function sumTo(n) return n * (n + 1) // 2 end");
    expect(r.passed).toBe(false);
    expect(r.checks.filter((c) => !c.passed).map((c) => c.label)).toEqual(["נעשה שימוש בלולאה"]);
  });

  it("functions: hard-coded 0 and 100 are caught by a different range", async () => {
    const src = "function clamp(v, lo, hi)\n if v < 0 then return 0 elseif v > 100 then return 100 end\n return v\nend";
    const r = await gradeLuaLesson(L("lua-07-functions"), src);
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.label.includes("10–20"))!.passed).toBe(false);
  });

  it("lists: empty list division is detected", async () => {
    const src = "function average(t)\n local s = 0\n for _, n in ipairs(t) do s = s + n end\n return s / #t\nend";
    const r = await gradeLuaLesson(L("lua-08-tables-lists"), src);
    const empty = r.checks.find((c) => c.label.includes("ריקה"))!;
    expect(empty.passed).toBe(false);
    expect(empty.message).toContain("חילוק");
  });

  it("dictionaries: counting keys instead of quantities is explained", async () => {
    const src = "function countItems(inv) local n = 0 for _ in pairs(inv) do n = n + 1 end return n end\nfunction hasItem(inv, name) return (inv[name] or 0) > 0 end";
    const r = await gradeLuaLesson(L("lua-09-tables-maps"), src);
    expect(r.checks[1].message).toContain("סוגי פריטים");
  });

  it("project: alternative correct solution (math.floor) also passes", async () => {
    const src = "local function lvl(x) return math.floor(x / 100) + 1 end\nfunction levelFromXp(xp) return lvl(xp) end\nfunction addXp(p, a)\n if not (a > 0) then return false end\n p.xp = p.xp + a\n p.level = levelFromXp(p.xp)\n return true\nend";
    const r = await gradeLuaLesson(L("lua-10-project-xp"), src);
    expect(r.checks.filter((c) => !c.passed)).toEqual([]);
  });
});
