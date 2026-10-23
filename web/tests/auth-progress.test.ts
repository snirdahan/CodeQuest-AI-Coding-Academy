import { beforeEach, describe, expect, it } from "vitest";
import { getLesson } from "@/content/catalog";
import {
  authenticate, createPairCode, createSession, createUser, redeemPairCode, revokeAllExtensionTokens,
  userFromExtensionToken, userFromSessionToken, deleteSession,
} from "@/lib/auth";
import { db, resetDbForTests } from "@/lib/db";
import { gradeLuaLesson } from "@/lib/grading/grade";
import { checkSolution, getSolution, loadAccessibleLesson, publicExercise, ServiceError } from "@/lib/lesson-service";
import { computeStreak, getStats, levelFromXp, recordAttempt, recordQuizAnswer, xpForLevel } from "@/lib/progress";

beforeEach(() => resetDbForTests());

describe("authentication", () => {
  it("creates users, rejects duplicates and wrong passwords", () => {
    const u = createUser("Dana@Example.com", "supersecret", "דנה");
    expect(u.email).toBe("dana@example.com");
    expect(u.password_hash).not.toContain("supersecret");
    expect(() => createUser("dana@example.com", "supersecret2", "x")).toThrow(/כבר קיים/);
    expect(() => authenticate("dana@example.com", "wrong-password")).toThrow();
    expect(authenticate("DANA@example.com", "supersecret").id).toBe(u.id);
  });

  it("validates input", () => {
    expect(() => createUser("not-an-email", "supersecret", "x")).toThrow(/אימייל/);
    expect(() => createUser("a@b.co", "short", "x")).toThrow(/8/);
  });

  it("sessions work and can be deleted; tokens are stored hashed", () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const { token } = createSession(u.id);
    expect(userFromSessionToken(token)?.id).toBe(u.id);
    expect(db().prepare("SELECT COUNT(*) c FROM sessions WHERE token_hash = ?").get(token)).toEqual({ c: 0 });
    deleteSession(token);
    expect(userFromSessionToken(token)).toBeUndefined();
    expect(userFromSessionToken("forged")).toBeUndefined();
  });
});

describe("VS Code pairing", () => {
  it("pair code is one-time and yields a working extension token", () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const code = createPairCode(u.id);
    const { token, user } = redeemPairCode(code);
    expect(user.id).toBe(u.id);
    expect(userFromExtensionToken(token)?.id).toBe(u.id);
    expect(() => redeemPairCode(code)).toThrow(); // already used
  });

  it("expired codes are rejected and tokens can be revoked", () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const code = createPairCode(u.id);
    db().prepare("UPDATE pair_codes SET expires_at = 0").run();
    expect(() => redeemPairCode(code)).toThrow(/תוקפו/);
    const { token } = redeemPairCode(createPairCode(u.id));
    revokeAllExtensionTokens(u.id);
    expect(userFromExtensionToken(token)).toBeUndefined();
  });
});

describe("XP, levels and streaks", () => {
  it("level curve", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
    expect(xpForLevel(4)).toBe(600);
  });

  it("streak counts consecutive days ending today or yesterday", () => {
    expect(computeStreak(["2026-10-21", "2026-10-22", "2026-10-23"], "2026-10-23")).toBe(3);
    expect(computeStreak(["2026-10-21", "2026-10-22"], "2026-10-23")).toBe(2);
    expect(computeStreak(["2026-10-20"], "2026-10-23")).toBe(0);
    expect(computeStreak([], "2026-10-23")).toBe(0);
  });

  it("XP is awarded once per challenge – repeating a solved exercise pays nothing", async () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const lesson = getLesson("lua-01-hello")!;
    const fail = await gradeLuaLesson(lesson, "-- nothing");
    expect(recordAttempt(u.id, lesson, fail, { via: "web", hintsUsed: 0, code: "" }).xpAwarded).toBe(0);
    const pass = await gradeLuaLesson(lesson, 'print("hi")');
    const first = recordAttempt(u.id, lesson, pass, { via: "web", hintsUsed: 0, code: 'print("hi")' });
    expect(first.xpAwarded).toBe(lesson.xp);
    expect(first.firstCompletion).toBe(true);
    const again = recordAttempt(u.id, lesson, pass, { via: "web", hintsUsed: 0, code: 'print("hi")' });
    expect(again.xpAwarded).toBe(0);
    expect(getStats(u.id).xp).toBe(lesson.xp);
    expect(getStats(u.id).streak).toBe(1);
  });

  it("quiz XP only for the correct answer, once", () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const lesson = getLesson("lua-01-hello")!;
    const correct = lesson.quiz.options.findIndex((o) => o.correct);
    const wrong = lesson.quiz.options.findIndex((o) => !o.correct);
    expect(recordQuizAnswer(u.id, lesson, wrong).xpAwarded).toBe(0);
    expect(recordQuizAnswer(u.id, lesson, correct).xpAwarded).toBe(10);
    expect(recordQuizAnswer(u.id, lesson, correct).xpAwarded).toBe(0);
  });

  it("achievements: first try without hints, and via VS Code", async () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const lesson = getLesson("lua-01-hello")!;
    const pass = await gradeLuaLesson(lesson, 'print("hi")');
    const r = recordAttempt(u.id, lesson, pass, { via: "vscode", hintsUsed: 0, code: "" });
    const ids = r.newAchievements.map((a) => a.id).sort();
    expect(ids).toEqual(["first-lesson", "first-run", "first-try", "vscode"]);
  });
});

describe("access control", () => {
  it("lessons unlock in order; premium lessons need premium", async () => {
    const u = createUser("a@b.co", "supersecret", "A");
    expect(() => loadAccessibleLesson(u, "lua-02-variables")).toThrow(ServiceError);
    expect(() => loadAccessibleLesson(u, "nope")).toThrow(/לא נמצא/);
    await checkSolution(u, "lua-01-hello", 'print("hi")', 0, "web");
    expect(loadAccessibleLesson(u, "lua-02-variables").id).toBe("lua-02-variables");

    for (const id of ["lua-02-variables", "lua-03-numbers", "lua-04-strings", "lua-05-conditions"]) {
      const r = await checkSolution(u, id, getLesson(id)!.challenge.solution, 0, "web");
      expect(r.passed).toBe(true);
    }
    try {
      loadAccessibleLesson(u, "lua-06-loops");
      throw new Error("should be locked");
    } catch (e) {
      expect((e as ServiceError).status).toBe(402);
    }
    db().prepare("UPDATE users SET plan = 'beta_premium' WHERE id = ?").run(u.id);
    const premiumUser = { ...u, plan: "beta_premium" as const };
    expect(loadAccessibleLesson(premiumUser, "lua-06-loops").id).toBe("lua-06-loops");
  });

  it("public exercise never contains the solution; solution unlocks after 3 attempts", async () => {
    const u = createUser("a@b.co", "supersecret", "A");
    const ex = publicExercise(u, getLesson("lua-01-hello")!);
    expect(JSON.stringify(ex)).not.toContain("CodeQuest!\")"); // reference solution text
    expect(() => getSolution(u, "lua-01-hello")).toThrow(/3/);
    for (let i = 0; i < 3; i++) await checkSolution(u, "lua-01-hello", "-- try " + i, 0, "web");
    expect(getSolution(u, "lua-01-hello").solution).toContain("print");
  });

  it("users cannot see each other's progress", async () => {
    const a = createUser("a@b.co", "supersecret", "A");
    const b = createUser("b@b.co", "supersecret", "B");
    await checkSolution(a, "lua-01-hello", 'print("hi")', 0, "web");
    expect(getStats(a.id).completedLessons).toBe(1);
    expect(getStats(b.id).completedLessons).toBe(0);
    expect(getStats(b.id).xp).toBe(0);
  });
});
