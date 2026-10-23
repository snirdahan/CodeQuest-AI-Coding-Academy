import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { ServiceError } from "./lesson-service";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler: maps known errors to clean JSON responses in Hebrew. */
export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ServiceError) return json({ error: e.message }, e.status);
    if (e instanceof AuthError) return json({ error: e.message }, 400);
    if (e && typeof e === "object" && "digest" in e) throw e; // Next.js redirect / notFound
    console.error(e);
    return json({ error: "שגיאה לא צפויה בשרת." }, 500);
  }
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}
