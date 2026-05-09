"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "@/components/icons";
import { loginAction, type LoginState } from "@/lib/auth/session";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={action} className="w-full max-w-[380px]">
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] mb-1.5">
        Ingresá a tu cuenta
      </h2>
      <p className="text-muted-foreground text-[13.5px] mb-7">
        Acceso exclusivo para usuarios Productor y Administrativo.
      </p>

      <div className="flex flex-col gap-1.5 mb-3.5">
        <label className="text-[12.5px] font-medium text-brand-fg-2">
          Email corporativo<span className="text-destructive ml-0.5">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
          <input
            name="email"
            type="email"
            placeholder="nombre@productora.com.ar"
            autoFocus
            required
            className="w-full h-10 border border-border bg-card rounded-lg pl-9 pr-3 text-[13.5px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(15,39,68,0.08)] transition-colors placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-3.5">
        <label className="text-[12.5px] font-medium text-brand-fg-2">
          Contraseña<span className="text-destructive ml-0.5">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
          <input
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            required
            className="w-full h-10 border border-border bg-card rounded-lg pl-9 pr-10 text-[13.5px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(15,39,68,0.08)] transition-colors placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center text-muted-foreground rounded hover:bg-brand-surface-hover"
          >
            {showPw ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center text-[12.5px] my-4">
        <label className="inline-flex items-center gap-2 cursor-pointer text-brand-fg-2">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="accent-primary"
          />
          Recordarme
        </label>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-brand-danger-soft text-destructive text-[12.5px] rounded-lg px-3 py-2.5 mb-3"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-[42px] bg-primary text-primary-foreground rounded-lg font-semibold text-[14px] inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {pending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Validando…
          </>
        ) : (
          <>
            Ingresar
            <ArrowRight className="w-[15px] h-[15px]" />
          </>
        )}
      </button>
    </form>
  );
}
