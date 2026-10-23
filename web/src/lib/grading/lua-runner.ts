import { spawn } from "node:child_process";
import path from "node:path";

export type LuaErrorKind = "syntax" | "runtime" | "timeout" | "memory" | "internal";

export interface LuaRunResult {
  ok: boolean;
  output: string[];
  /** Values reported by the grading harness via __cq.report({...}) */
  results: Record<string, unknown>[];
  truncated: boolean;
  error?: { kind: LuaErrorKind; message: string; line?: number };
}

const HARD_TIMEOUT_MS = 3000;
const MAX_CODE_CHARS = 20_000;

function runnerDir() {
  return path.join(process.cwd(), "runner");
}

/**
 * Runs learner Lua code in a separate, permission-restricted Node process.
 * Learner code never executes inside the web server process.
 */
export function runLua(code: string, harness?: string): Promise<LuaRunResult> {
  if (code.length > MAX_CODE_CHARS) {
    return Promise.resolve({
      ok: false, output: [], results: [], truncated: false,
      error: { kind: "internal", message: "הקוד ארוך מדי לבדיקה (מעל 20,000 תווים)." },
    });
  }
  const dir = runnerDir();
  const wasmoonDir = path.join(process.cwd(), "node_modules", "wasmoon");
  const args = [
    "--permission",
    `--allow-fs-read=${dir}`,
    `--allow-fs-read=${wasmoonDir}`,
    "--max-old-space-size=96",
    path.join(dir, "lua-sandbox.mjs"),
  ];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
      // Minimal environment: no secrets from the server process leak into the sandbox.
      env: { NODE_OPTIONS: "" } as unknown as NodeJS.ProcessEnv,
    });
    let stdout = "";
    let stderr = "";
    let done = false;
    const finish = (r: LuaRunResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({
        ok: false, output: [], results: [], truncated: false,
        error: { kind: "timeout", message: "התוכנית רצה יותר מדי זמן ונעצרה (כנראה לולאה אינסופית)." },
      });
    }, HARD_TIMEOUT_MS);
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("close", () => {
      try {
        finish(JSON.parse(stdout) as LuaRunResult);
      } catch {
        finish({
          ok: false, output: [], results: [], truncated: false,
          error: { kind: "internal", message: `Sandbox failed: ${stderr.slice(0, 500)}` },
        });
      }
    });
    child.stdin.end(JSON.stringify({ code, harness }));
  });
}
