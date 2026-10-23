import { handle, json } from "@/lib/http";
import { getSolution, ServiceError } from "@/lib/lesson-service";
import { currentUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    if (!user) throw new ServiceError(401, "צריך להתחבר.");
    const { id } = await params;
    return json(getSolution(user, id));
  });
}
