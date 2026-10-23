import * as os from "node:os";
import * as path from "node:path";

// The extension only ever creates and reads files inside the CodeQuest exercises folder.

const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,80}$/;
const SAFE_FILE = /^[A-Za-z0-9_-]{1,60}\.(lua|html|css|js)$/;

export function exercisesRoot(configured: string | undefined): string {
  return configured && configured.trim() ? path.resolve(configured.trim()) : path.join(os.homedir(), "CodeQuest");
}

export function isSafeId(id: string) {
  return SAFE_ID.test(id);
}

export function exerciseFilePath(root: string, courseId: string, lessonId: string, fileName: string): string {
  if (!isSafeId(courseId) || !isSafeId(lessonId) || !SAFE_FILE.test(fileName)) {
    throw new Error("Invalid exercise identifiers received from server");
  }
  return path.join(root, courseId, lessonId, fileName);
}

/** If `file` is an exercise file inside root, returns its lesson id. */
export function lessonIdForFile(root: string, file: string): string | undefined {
  const rel = path.relative(root, file);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return undefined;
  const parts = rel.split(path.sep);
  if (parts.length !== 3) return undefined;
  const [courseId, lessonId, fileName] = parts;
  return isSafeId(courseId) && isSafeId(lessonId) && SAFE_FILE.test(fileName) ? lessonId : undefined;
}
