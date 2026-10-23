import { ALL_LESSONS, QUIZ_XP, getCourse, getLesson } from "@/content/catalog";
import type { Lesson } from "@/content/types";
import { db, track, type ProgressRow, type UserRow } from "./db";
import type { GradeResult } from "./grading/grade";

// XP, levels, streaks and achievements. Every reward is tied to real progress and is idempotent
// (xp_events has UNIQUE(user, reason, ref)), so repeating a solved exercise never pays again.

export const TIMEZONE = "Asia/Jerusalem";

/** Total XP needed to reach `level`. Level 2 = 100, level 3 = 300, level 4 = 600 ... */
export function xpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function dayString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date); // YYYY-MM-DD
}

function previousDay(day: string) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function computeStreak(days: string[], today = dayString()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : previousDay(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-run", title: "הקוד הראשון", description: "הרצתם קוד בפעם הראשונה", icon: "🚀" },
  { id: "first-lesson", title: "צעד ראשון", description: "השלמתם אתגר קוד ראשון", icon: "🌱" },
  { id: "first-try", title: "בול בפעם הראשונה", description: "פתרתם אתגר בניסיון הראשון, בלי רמזים", icon: "🎯" },
  { id: "persistent", title: "לא מוותרים", description: "פתרתם אתגר אחרי 3 ניסיונות או יותר", icon: "💪" },
  { id: "five-lessons", title: "בדרך הנכונה", description: "השלמתם 5 שיעורים", icon: "🔥" },
  { id: "lua-basics-complete", title: "בוגרי Lua מאפס", description: "השלמתם את כל המסלול", icon: "🏆" },
  { id: "vscode", title: "מפתחים אמיתיים", description: "פתרתם תרגיל מתוך VS Code", icon: "🧩" },
  { id: "streak-3", title: "רצף של 3 ימים", description: "כתבתם קוד 3 ימים ברציפות", icon: "📅" },
  { id: "streak-7", title: "שבוע שלם", description: "כתבתם קוד 7 ימים ברציפות", icon: "⭐" },
  { id: "level-5", title: "רמה 5", description: "הגעתם לרמה 5", icon: "👑" },
];

export function hasPremium(user: Pick<UserRow, "plan">) {
  return user.plan === "premium" || user.plan === "beta_premium";
}

export function progressMap(userId: number): Map<string, ProgressRow> {
  const rows = db().prepare("SELECT * FROM lesson_progress WHERE user_id = ?").all(userId) as ProgressRow[];
  return new Map(rows.map((r) => [r.lesson_id, r]));
}

export type LessonAccess = "open" | "locked-order" | "locked-premium";

export function lessonAccess(user: Pick<UserRow, "plan">, lesson: Lesson, progress: Map<string, ProgressRow>): LessonAccess {
  if (lesson.premium && !hasPremium(user)) return "locked-premium";
  const course = getCourse(lesson.courseId)!;
  const i = course.lessons.findIndex((l) => l.id === lesson.id);
  if (i > 0 && !progress.get(course.lessons[i - 1].id)?.challenge_done) return "locked-order";
  return "open";
}

export function totalXp(userId: number): number {
  const row = db().prepare("SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE user_id = ?").get(userId) as { xp: number };
  return row.xp;
}

export function getStats(userId: number) {
  const xp = totalXp(userId);
  const level = levelFromXp(xp);
  const days = (db().prepare("SELECT day FROM activity_days WHERE user_id = ?").all(userId) as { day: string }[]).map((d) => d.day);
  const unlocked = db().prepare("SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC").all(userId) as {
    achievement_id: string;
    unlocked_at: string;
  }[];
  const progress = progressMap(userId);
  const completed = [...progress.values()].filter((p) => p.challenge_done).length;
  return {
    xp,
    level,
    levelStartXp: xpForLevel(level),
    nextLevelXp: xpForLevel(level + 1),
    streak: computeStreak(days),
    activeToday: days.includes(dayString()),
    completedLessons: completed,
    achievements: unlocked,
    progress,
  };
}

function award(userId: number, amount: number, reason: string, ref: string): number {
  const info = db().prepare("INSERT OR IGNORE INTO xp_events (user_id, amount, reason, ref) VALUES (?, ?, ?, ?)").run(userId, amount, reason, ref);
  return info.changes > 0 ? amount : 0;
}

function unlock(userId: number, id: string): boolean {
  return db().prepare("INSERT OR IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)").run(userId, id).changes > 0;
}

function evaluateAchievements(userId: number, extra: string[] = []): string[] {
  const stats = getStats(userId);
  const earned = [...extra];
  if (stats.completedLessons >= 1) earned.push("first-lesson");
  if (stats.completedLessons >= 5) earned.push("five-lessons");
  const basics = getCourse("lua-basics")!;
  if (basics.lessons.every((l) => stats.progress.get(l.id)?.challenge_done)) earned.push("lua-basics-complete");
  if (stats.streak >= 3) earned.push("streak-3");
  if (stats.streak >= 7) earned.push("streak-7");
  if (stats.level >= 5) earned.push("level-5");
  return earned.filter((id) => unlock(userId, id));
}

export interface AttemptOutcome {
  xpAwarded: number;
  firstCompletion: boolean;
  newAchievements: AchievementDef[];
  levelBefore: number;
  levelAfter: number;
  attempts: number;
}

export function recordAttempt(
  userId: number,
  lesson: Lesson,
  result: GradeResult,
  opts: { via: "web" | "vscode"; hintsUsed: number; code: string },
): AttemptOutcome {
  const levelBefore = levelFromXp(totalXp(userId));
  const conn = db();
  const outcome = conn.transaction(() => {
    conn.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(userId, lesson.id);
    const before = conn.prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(userId, lesson.id) as ProgressRow;
    const attempts = before.attempts + 1;
    const hints = Math.max(before.hints_used, Math.min(opts.hintsUsed, lesson.challenge.hints.length));
    const firstCompletion = result.passed && !before.challenge_done;
    conn
      .prepare(
        `UPDATE lesson_progress SET attempts = ?, hints_used = ?, last_code = ?, updated_at = datetime('now'),
           challenge_done = CASE WHEN ? THEN 1 ELSE challenge_done END,
           completed_at = CASE WHEN ? THEN datetime('now') ELSE completed_at END,
           completed_via = CASE WHEN ? THEN ? ELSE completed_via END
         WHERE user_id = ? AND lesson_id = ?`,
      )
      .run(attempts, hints, opts.code.slice(0, 20000), result.passed ? 1 : 0, firstCompletion ? 1 : 0, firstCompletion ? 1 : 0, opts.via, userId, lesson.id);
    conn.prepare("INSERT OR IGNORE INTO activity_days (user_id, day) VALUES (?, ?)").run(userId, dayString());

    let xp = 0;
    const extra: string[] = ["first-run"];
    if (firstCompletion) {
      xp += award(userId, lesson.xp, "challenge", lesson.id);
      if (attempts === 1 && hints === 0) extra.push("first-try");
      if (attempts >= 3) extra.push("persistent");
      if (opts.via === "vscode") extra.push("vscode");
    }
    const newIds = evaluateAchievements(userId, extra);
    return { xp, firstCompletion, newIds, attempts };
  })();

  track(userId, result.passed ? "challenge_passed" : "challenge_failed", { lesson: lesson.id, via: opts.via });
  const levelAfter = levelFromXp(totalXp(userId));
  return {
    xpAwarded: outcome.xp,
    firstCompletion: outcome.firstCompletion,
    newAchievements: ACHIEVEMENTS.filter((a) => outcome.newIds.includes(a.id)),
    levelBefore,
    levelAfter,
    attempts: outcome.attempts,
  };
}

export function recordQuizAnswer(userId: number, lesson: Lesson, optionIndex: number) {
  const option = lesson.quiz.options[optionIndex];
  if (!option) throw new Error("bad option");
  const correct = !!option.correct;
  let xpAwarded = 0;
  if (correct) {
    db().prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(userId, lesson.id);
    db().prepare("UPDATE lesson_progress SET quiz_done = 1, updated_at = datetime('now') WHERE user_id = ? AND lesson_id = ?").run(userId, lesson.id);
    xpAwarded = award(userId, QUIZ_XP, "quiz", lesson.id);
  }
  return { correct, why: option.why, xpAwarded };
}

export function recordHintUsed(userId: number, lesson: Lesson, count: number) {
  db().prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(userId, lesson.id);
  db()
    .prepare("UPDATE lesson_progress SET hints_used = MAX(hints_used, ?) WHERE user_id = ? AND lesson_id = ?")
    .run(Math.min(count, lesson.challenge.hints.length), userId, lesson.id);
}

/** The next lesson the learner should do: first open lesson whose challenge isn't done. */
export function recommendedLesson(user: UserRow): Lesson | undefined {
  const progress = progressMap(user.id);
  return ALL_LESSONS.find((l) => !progress.get(l.id)?.challenge_done && lessonAccess(user, l, progress) === "open")
    ?? ALL_LESSONS.find((l) => !progress.get(l.id)?.challenge_done);
}

export const SOLUTION_UNLOCK_ATTEMPTS = 3;

export function canSeeSolution(userId: number, lessonId: string) {
  const row = db().prepare("SELECT attempts, challenge_done FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(userId, lessonId) as
    | { attempts: number; challenge_done: number }
    | undefined;
  return !!row && (row.challenge_done === 1 || row.attempts >= SOLUTION_UNLOCK_ATTEMPTS);
}

export { getLesson };
