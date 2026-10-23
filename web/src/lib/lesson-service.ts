import { getCourse, getLesson, nextLessonOf } from "@/content/catalog";
import type { Lesson } from "@/content/types";
import type { UserRow } from "./db";
import { gradeLuaLesson, type GradeResult } from "./grading/grade";
import { canSeeSolution, getStats, lessonAccess, levelFromXp, progressMap, recordAttempt, type AttemptOutcome } from "./progress";

// Shared by the website and the VS Code extension API, so both grade and reward identically.

export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const recentChecks = new Map<number, number[]>();
const CHECKS_PER_MINUTE = 20;

function rateLimit(userId: number) {
  const now = Date.now();
  const list = (recentChecks.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= CHECKS_PER_MINUTE) throw new ServiceError(429, "יותר מדי בדיקות בדקה אחת. חכו רגע ונסו שוב.");
  list.push(now);
  recentChecks.set(userId, list);
}

export function loadAccessibleLesson(user: UserRow, lessonId: string): Lesson {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new ServiceError(404, "השיעור לא נמצא.");
  const access = lessonAccess(user, lesson, progressMap(user.id));
  if (access === "locked-premium") throw new ServiceError(402, "השיעור הזה זמין במסלול Premium.");
  if (access === "locked-order") throw new ServiceError(403, "קודם צריך להשלים את השיעור הקודם.");
  return lesson;
}

/** Exercise data that is safe to send to a client (no solution, no hidden tests). */
export function publicExercise(user: UserRow, lesson: Lesson) {
  const course = getCourse(lesson.courseId)!;
  const p = progressMap(user.id).get(lesson.id);
  const next = nextLessonOf(lesson.id);
  return {
    id: lesson.id,
    title: lesson.title,
    courseId: course.id,
    courseTitle: course.title,
    language: "lua",
    objective: lesson.objective,
    xp: lesson.xp,
    instructions: lesson.challenge.instructions,
    fileName: lesson.challenge.fileName,
    starterCode: lesson.challenge.starterCode,
    hints: lesson.challenge.hints,
    checkLabels: lesson.challenge.checks.map((c) => c.label),
    completed: !!p?.challenge_done,
    attempts: p?.attempts ?? 0,
    lastCode: p?.last_code ?? null,
    nextLessonId: next?.id ?? null,
    nextLessonTitle: next?.title ?? null,
  };
}

export interface CheckResponse extends GradeResult {
  reward: AttemptOutcome;
  stats: { xp: number; level: number; streak: number };
  solutionAvailable: boolean;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}

export async function checkSolution(
  user: UserRow,
  lessonId: string,
  code: unknown,
  hintsUsed: unknown,
  via: "web" | "vscode",
): Promise<CheckResponse> {
  const lesson = loadAccessibleLesson(user, lessonId);
  if (typeof code !== "string") throw new ServiceError(400, "חסר קוד לבדיקה.");
  rateLimit(user.id);
  const result = await gradeLuaLesson(lesson, code);
  const reward = recordAttempt(user.id, lesson, result, { via, hintsUsed: Number(hintsUsed) || 0, code });
  const stats = getStats(user.id);
  const next = nextLessonOf(lesson.id);
  return {
    ...result,
    reward,
    stats: { xp: stats.xp, level: levelFromXp(stats.xp), streak: stats.streak },
    solutionAvailable: canSeeSolution(user.id, lesson.id),
    nextLessonId: next?.id ?? null,
    nextLessonTitle: next?.title ?? null,
  };
}

export function getSolution(user: UserRow, lessonId: string) {
  const lesson = loadAccessibleLesson(user, lessonId);
  if (!canSeeSolution(user.id, lessonId)) {
    throw new ServiceError(403, "הפתרון המלא נפתח אחרי 3 ניסיונות. נסו קודם את הרמזים – זה הרבה יותר שווה ללמידה.");
  }
  return { solution: lesson.challenge.solution, explanation: lesson.challenge.solutionExplanation };
}
