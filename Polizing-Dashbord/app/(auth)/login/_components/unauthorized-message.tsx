"use client";

import { SignOutButton } from "@clerk/nextjs";

export function UnauthorizedMessage() {
  return (
    <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-8 text-center shadow-none">
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mx-auto mb-4 text-2xl font-bold select-none">
        ✕
      </div>
      <h2 className="text-[17px] font-semibold text-foreground mb-2">
        Acceso denegado
      </h2>
      <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-6">
        Tu cuenta no está registrada en el sistema. Contactá al administrador para
        que te dé acceso.
      </p>
      <SignOutButton redirectUrl="/login">
        <button
          type="button"
          className="w-full rounded-lg bg-primary text-primary-foreground text-[13.5px] font-medium py-2.5 hover:brightness-110 transition-all"
        >
          Cerrar sesión y volver
        </button>
      </SignOutButton>
    </div>
  );
}
