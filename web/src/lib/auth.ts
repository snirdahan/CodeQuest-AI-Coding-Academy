import crypto from "node:crypto";
import { db, type UserRow } from "./db";

// Framework-independent authentication logic (unit-tested). Cookie handling lives in session.ts.

const SESSION_DAYS = 30;
const PAIR_CODE_MINUTES = 10;

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const randomToken = () => crypto.randomBytes(32).toString("base64url");

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const key = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && crypto.timingSafeEqual(key, expected);
}

export class AuthError extends Error {}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createUser(emailRaw: string, password: string, displayName: string): UserRow {
  const email = normalizeEmail(emailRaw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError("כתובת האימייל לא תקינה.");
  if (password.length < 8) throw new AuthError("הסיסמה צריכה להיות באורך 8 תווים לפחות.");
  const name = displayName.trim().slice(0, 40);
  if (!name) throw new AuthError("נא לכתוב שם תצוגה.");
  const exists = db().prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) throw new AuthError("כבר קיים חשבון עם האימייל הזה. אפשר להתחבר.");
  const info = db()
    .prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)")
    .run(email, hashPassword(password), name);
  return getUserById(Number(info.lastInsertRowid))!;
}

export function authenticate(emailRaw: string, password: string): UserRow {
  const user = db().prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(emailRaw)) as UserRow | undefined;
  // Always run scrypt to keep timing similar whether or not the user exists.
  const ok = verifyPassword(password, user?.password_hash ?? hashPassword("dummy-password"));
  if (!user || !ok) throw new AuthError("האימייל או הסיסמה שגויים.");
  return user;
}

export function getUserById(id: number): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

// ---- Web sessions ----
export function createSession(userId: number): { token: string; expires: Date } {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires.getTime());
  return { token, expires };
}

export function userFromSessionToken(token: string | undefined): UserRow | undefined {
  if (!token) return undefined;
  const row = db().prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?").get(sha256(token)) as
    | { user_id: number; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now()) return undefined;
  return getUserById(row.user_id);
}

export function deleteSession(token: string | undefined) {
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
}

// ---- VS Code extension pairing ----
/** One-time code the website hands to the extension (inside the vscode:// link). */
export function createPairCode(userId: number): string {
  const code = randomToken();
  db().prepare("DELETE FROM pair_codes WHERE expires_at < ?").run(Date.now());
  db().prepare("INSERT INTO pair_codes (code_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(code), userId, Date.now() + PAIR_CODE_MINUTES * 60e3);
  return code;
}

/** Exchanges a one-time pair code for a long-lived extension token. The code is consumed. */
export function redeemPairCode(code: string): { token: string; user: UserRow } {
  const h = sha256(code);
  const tx = db().transaction(() => {
    const row = db().prepare("SELECT user_id, expires_at FROM pair_codes WHERE code_hash = ?").get(h) as
      | { user_id: number; expires_at: number }
      | undefined;
    db().prepare("DELETE FROM pair_codes WHERE code_hash = ?").run(h);
    if (!row || row.expires_at < Date.now()) throw new AuthError("קוד החיבור לא תקף או שפג תוקפו. לחצו שוב על \"תרגל ב־VS Code\" באתר.");
    const token = randomToken();
    db().prepare("INSERT INTO ext_tokens (token_hash, user_id) VALUES (?, ?)").run(sha256(token), row.user_id);
    return { token, user: getUserById(row.user_id)! };
  });
  return tx();
}

export function userFromExtensionToken(token: string | undefined): UserRow | undefined {
  if (!token) return undefined;
  const h = sha256(token);
  const row = db().prepare("SELECT user_id FROM ext_tokens WHERE token_hash = ?").get(h) as { user_id: number } | undefined;
  if (!row) return undefined;
  db().prepare("UPDATE ext_tokens SET last_used_at = datetime('now') WHERE token_hash = ?").run(h);
  return getUserById(row.user_id);
}

export function revokeExtensionToken(token: string) {
  db().prepare("DELETE FROM ext_tokens WHERE token_hash = ?").run(sha256(token));
}

export function revokeAllExtensionTokens(userId: number) {
  db().prepare("DELETE FROM ext_tokens WHERE user_id = ?").run(userId);
}

export function listExtensionTokens(userId: number) {
  return db().prepare("SELECT created_at, last_used_at FROM ext_tokens WHERE user_id = ? ORDER BY created_at DESC").all(userId) as {
    created_at: string;
    last_used_at: string | null;
  }[];
}
