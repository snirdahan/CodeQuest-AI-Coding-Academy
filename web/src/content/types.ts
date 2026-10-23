// Content model for CodeQuest. Language → Track → Course → Lesson.
// Adding a new language = new catalog entry + content folder + a grader for that language.

export type LanguageId = "lua" | "html-css" | "javascript" | "java" | "python";
export type ContentStatus = "available" | "in-progress" | "planned";

/** Inline text supports `code` spans written with backticks. */
export type Block =
  | { type: "p"; text: string }
  | { type: "code"; code: string; output?: string; caption?: string }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "list"; items: string[] };

export interface QuizOption {
  text: string;
  correct?: boolean;
  /** Why this answer is right / wrong. Shown after choosing it. */
  why: string;
}

export interface Quiz {
  question: string;
  code?: string;
  options: QuizOption[];
}

/** Everything a check can look at after the learner's code ran. */
export interface CheckContext {
  source: string;
  /** Source with comments removed – use it for "did they use X" checks. */
  code: string;
  output: string[];
  /** Objects reported by the hidden harness, in order. */
  results: Record<string, unknown>[];
  /** First harness result, or {} – most harnesses report once. */
  r: Record<string, any>;
}

export interface Check {
  /** Short Hebrew label shown in the results list. */
  label: string;
  /** Return true when passed, or a Hebrew explanation of what is wrong (without revealing the full answer). */
  test: (ctx: CheckContext) => true | string;
  /**
   * Optional: run the learner's code again with a modified source (e.g. different input values)
   * and give `test` the context of that run. `transform` returns null if the source can't be adapted.
   */
  rerun?: { transform: (source: string) => string | null; harness?: string };
}

export interface Challenge {
  instructions: Block[];
  fileName: string;
  starterCode: string;
  /** Progressive hints, from small nudge to detailed guidance. */
  hints: string[];
  /** Hidden Lua appended after the learner's code; reports values with __cq.report({...}). */
  harness?: string;
  checks: Check[];
  /** Reference solution. Never sent to the client before enough attempts; used in tests. */
  solution: string;
  /** Explanation shown together with the solution. */
  solutionExplanation: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  minutes: number;
  premium: boolean;
  /** XP for completing the coding challenge (the quiz gives QUIZ_XP extra). */
  xp: number;
  objective: string;
  explanation: Block[];
  quiz: Quiz;
  challenge: Challenge;
}

export interface Course {
  id: string;
  trackId: string;
  title: string;
  description: string;
  level: "מתחילים" | "בינוני" | "מתקדמים";
  status: ContentStatus;
  lessons: Lesson[];
  /** Planned lessons that are not built yet – shown as "בקרוב". */
  upcoming?: string[];
}

export interface Track {
  id: string;
  languageId: LanguageId;
  title: string;
  subtitle: string;
  description: string;
  status: ContentStatus;
  premium: boolean;
  icon: string;
  /** Environment the learner needs outside CodeQuest, stated honestly. */
  environmentNote?: string;
  courses: Course[];
  roadmap?: string[];
}

export interface Language {
  id: LanguageId;
  name: string;
  tagline: string;
  status: ContentStatus;
  color: string;
  glyph: string;
  tracks: Track[];
}
