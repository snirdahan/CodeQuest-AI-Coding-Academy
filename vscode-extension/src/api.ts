// Thin client for the CodeQuest extension API (/api/ext/*). Authenticates with a Bearer token.

export interface Block {
  type: "p" | "code" | "tip" | "warn" | "list";
  text?: string;
  code?: string;
  output?: string;
  caption?: string;
  items?: string[];
}

export interface Exercise {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  language: string;
  objective: string;
  xp: number;
  instructions: Block[];
  fileName: string;
  starterCode: string;
  hints: string[];
  checkLabels: string[];
  completed: boolean;
  attempts: number;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}

export interface CheckResult {
  passed: boolean;
  output: string[];
  truncated: boolean;
  error?: { kind: string; line?: number; message: string; explanation: string };
  checks: { label: string; passed: boolean; message?: string }[];
  summary: string;
  reward: {
    xpAwarded: number;
    firstCompletion: boolean;
    newAchievements: { id: string; title: string; description: string; icon: string }[];
    levelBefore: number;
    levelAfter: number;
    attempts: number;
  };
  stats: { xp: number; level: number; streak: number };
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}

export interface Me {
  name: string;
  email: string;
  plan: string;
  xp: number;
  level: number;
  streak: number;
}

export interface LessonList {
  courses: { id: string; title: string; lessons: { id: string; title: string; completed: boolean; access: string }[] }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class CodeQuestApi {
  constructor(private server: string, private token?: string) {}

  private async request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    if (init.body !== undefined) headers["content-type"] = "application/json";
    let res: Response;
    try {
      res = await fetch(new URL(path, this.server), {
        method: init.method ?? "GET",
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new ApiError(0, `לא הצלחנו להתחבר לשרת CodeQuest (${this.server}). בדקו את החיבור לאינטרנט.`);
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new ApiError(res.status, data.error ?? `שגיאת שרת (${res.status})`);
    return data as T;
  }

  pair(code: string) {
    return this.request<{ token: string; user: { name: string; email: string } }>("/api/ext/pair", { method: "POST", body: { code } });
  }
  me() {
    return this.request<Me>("/api/ext/me");
  }
  disconnect() {
    return this.request<{ ok: boolean }>("/api/ext/me", { method: "DELETE" });
  }
  lessons() {
    return this.request<LessonList>("/api/ext/lessons");
  }
  exercise(id: string) {
    return this.request<Exercise>(`/api/ext/exercises/${encodeURIComponent(id)}`);
  }
  check(id: string, code: string, hintsUsed: number) {
    return this.request<CheckResult>(`/api/ext/exercises/${encodeURIComponent(id)}/check`, { method: "POST", body: { code, hintsUsed } });
  }
  hint(id: string, count: number) {
    return this.request<{ ok: boolean }>(`/api/ext/exercises/${encodeURIComponent(id)}/hint`, { method: "POST", body: { count } });
  }
}
