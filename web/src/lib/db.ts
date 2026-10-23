import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Single place for all database access. SQLite for development and beta;
// swapping to Postgres (e.g. Supabase) means re-implementing this module only.

let _db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',           -- free | beta_premium | premium
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ext_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT
);
CREATE TABLE IF NOT EXISTS pair_codes (
  code_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  quiz_done INTEGER NOT NULL DEFAULT 0,
  challenge_done INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  last_code TEXT,
  completed_at TEXT,
  completed_via TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id)
);
-- UNIQUE(user_id, reason, ref) makes every reward idempotent: the same lesson can never pay twice.
CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, reason, ref)
);
CREATE TABLE IF NOT EXISTS activity_days (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE TABLE IF NOT EXISTS early_access (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  price_ils INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  props TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function db(): Database.Database {
  if (_db) return _db;
  const file = process.env.CODEQUEST_DB_PATH ?? path.join(process.cwd(), "data", "codequest.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  _db = new Database(file);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(SCHEMA);
  return _db;
}

/** Test helper: use a fresh in-memory database. */
export function resetDbForTests() {
  _db?.close();
  _db = null;
  process.env.CODEQUEST_DB_PATH = ":memory:";
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  plan: "free" | "beta_premium" | "premium";
  created_at: string;
}

export interface ProgressRow {
  user_id: number;
  lesson_id: string;
  quiz_done: number;
  challenge_done: number;
  attempts: number;
  hints_used: number;
  last_code: string | null;
  completed_at: string | null;
  completed_via: string | null;
  updated_at: string;
}

/** Product analytics event (stored locally; no third-party tracking). */
export function track(userId: number | null, name: string, props?: Record<string, unknown>) {
  db().prepare("INSERT INTO events (user_id, name, props) VALUES (?, ?, ?)").run(userId, name, props ? JSON.stringify(props) : null);
}
