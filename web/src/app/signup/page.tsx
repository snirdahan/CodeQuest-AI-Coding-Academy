import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, Logo } from "@/components/ui";
import { currentUser } from "@/lib/session";

export default async function SignupPage() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="mb-8 flex justify-center text-2xl"><Logo /></Link>
        <Card className="p-8">
          <h1 className="mb-1 text-2xl font-bold">מתחילים לתכנת 🚀</h1>
          <p className="mb-6 text-slate-400">חשבון חינמי. בלי כרטיס אשראי.</p>
          <AuthForm mode="signup" />
        </Card>
      </div>
    </div>
  );
}
