import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession, userFromExtensionToken, userFromSessionToken } from "./auth";
import type { UserRow } from "./db";

export const SESSION_COOKIE = "cq_session";

export async function currentUser(): Promise<UserRow | undefined> {
  const jar = await cookies();
  return userFromSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<UserRow> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function startSession(userId: number) {
  const { token, expires } = createSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  deleteSession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
}

/** For /api/ext/* routes: the VS Code extension authenticates with a Bearer token. */
export async function extensionUser(): Promise<UserRow | undefined> {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return userFromExtensionToken(m?.[1]);
}
