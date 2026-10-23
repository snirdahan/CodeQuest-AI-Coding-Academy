import { body, handle, json } from "@/lib/http";
import { checkSolution, ServiceError } from "@/lib/lesson-service";
import { currentUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const { id } = await params;
    const b = await body(req);
    return json(await checkSolution(user, id, b.code, b.hintsUsed, "web"));
  });
}
