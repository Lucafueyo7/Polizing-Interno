import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DemoUsers } from "./_components/demo-users";
import { LoginAside } from "./_components/login-aside";
import { LoginForm } from "./_components/login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <LoginAside />
      <main className="grid place-items-center bg-background p-14">
        <div className="w-full max-w-[380px]">
          <LoginForm />
          <DemoUsers />
        </div>
      </main>
    </div>
  );
}
