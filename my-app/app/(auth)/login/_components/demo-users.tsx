import { DEMO_USERS } from "@/lib/auth/demo-users";
import { loginAsDemoUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

function initials(user: SessionUser): string {
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DemoUsers() {
  return (
    <div className="w-full max-w-[380px] mt-5">
      <div className="flex items-center gap-3 my-5 text-[11.5px] uppercase tracking-[0.06em] text-muted-foreground before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
        Acceso rápido demo
      </div>
      <div className="flex flex-col gap-2">
        {DEMO_USERS.map((user) => (
          <form key={user.email} action={loginAsDemoUser.bind(null, user.email)}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 border border-border rounded-[9px] bg-card text-left hover:border-primary hover:bg-brand-surface-hover transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary-soft text-primary grid place-items-center font-semibold text-[12px] shrink-0">
                {initials(user)}
              </div>
              <div className="min-w-0 flex-1">
                <b className="text-[13px] font-semibold block">{user.name}</b>
                <small className="text-[11.5px] text-muted-foreground">
                  {user.email}
                </small>
              </div>
              <span className="ml-auto text-[10.5px] uppercase tracking-[0.06em] font-semibold text-primary bg-brand-primary-soft px-2 py-1 rounded-md">
                {user.role}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
