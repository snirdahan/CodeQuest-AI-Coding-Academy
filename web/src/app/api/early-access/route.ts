import { db, track } from "@/lib/db";
import { body, handle, json } from "@/lib/http";
import { ServiceError } from "@/lib/lesson-service";
import { currentUser } from "@/lib/session";

/** Pricing test: records which monthly price the learner said they'd pay, then grants free beta premium. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const b = await body(req);
    const price = Number(b.price);
    if (![0, 19, 29, 39, 49].includes(price)) throw new ServiceError(400, "מחיר לא תקין.");
    const note = typeof b.note === "string" ? b.note.slice(0, 500) : null;
    db().prepare("INSERT OR REPLACE INTO early_access (user_id, price_ils, note) VALUES (?, ?, ?)").run(user.id, price, note);
    if (user.plan === "free") db().prepare("UPDATE users SET plan = 'beta_premium' WHERE id = ?").run(user.id);
    track(user.id, "early_access_joined", { price });
    return json({ ok: true });
  });
}
