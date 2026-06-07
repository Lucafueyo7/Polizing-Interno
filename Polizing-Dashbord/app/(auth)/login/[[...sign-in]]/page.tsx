import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginAside } from "../_components/login-aside";
import { UnauthorizedMessage } from "../_components/unauthorized-message";

export default async function LoginPage() {
  // Si el usuario está en nuestra BD, entrar directo.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  // Si hay sesión de Clerk pero el email no existe en nuestra BD (getCurrentUser
  // devolvió null), bloquear: mostrar el cartel en lugar del formulario para
  // evitar el loop Clerk → /dashboard → /login → Clerk.
  const { userId } = await auth();
  const isUnauthorized = userId !== null;

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <LoginAside />
      <main className="grid place-items-center bg-background p-4 sm:p-8 lg:p-14">
        {isUnauthorized ? (
          <UnauthorizedMessage />
        ) : (
          <SignIn
            path="/login"
            routing="path"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "var(--primary)",
                borderRadius: "10px",
                fontFamily: "var(--font-sans)",
              },
              elements: {
                rootBox: "w-full max-w-[420px]",
                cardBox: "w-full shadow-none",
                card: "shadow-none border border-border bg-card",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "border-border hover:bg-brand-surface-hover",
                formFieldInput:
                  "border-border bg-card focus:border-primary focus:shadow-[0_0_0_3px_rgba(15,39,68,0.08)]",
                formButtonPrimary:
                  "bg-primary text-primary-foreground hover:brightness-110",
                footer: "bg-transparent",
                footerAction: { style: { display: "none" } },
              },
            }}
          />
        )}
      </main>
    </div>
  );
}
