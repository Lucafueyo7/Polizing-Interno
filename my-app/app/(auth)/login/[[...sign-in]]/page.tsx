import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginAside } from "../_components/login-aside";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <LoginAside />
      <main className="grid place-items-center bg-background p-14">
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/login"
          fallbackRedirectUrl="/dashboard"
        />
      </main>
    </div>
  );
}
