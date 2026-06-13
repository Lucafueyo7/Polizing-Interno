"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { ChevronsLeft, ChevronsRight, Settings, Logout } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme/theme-provider";
import type { SessionUser } from "@/lib/auth/types";
import { NAV_ITEMS, type NavItemId } from "./sidebar-nav";
import {
  setMobileOpen,
  toggleCollapsed,
  useMobileOpen,
  useSidebarCollapsed,
} from "./sidebar-state";

type SidebarProps = {
  user: SessionUser;
  badges?: Partial<Record<NavItemId, number>>;
};

function userInitials(user: SessionUser): string {
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function Sidebar({ user, badges = {} }: SidebarProps) {
  const rawCollapsed = useSidebarCollapsed();
  const mobileOpen = useMobileOpen();
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const { theme } = useTheme();

  const collapsed = isDesktop && rawCollapsed;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div
        data-open={mobileOpen}
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className="md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 data-[open=false]:pointer-events-none data-[open=false]:opacity-0 data-[open=true]:opacity-100"
      />
      <aside
        data-collapsed={collapsed}
        data-mobile-open={mobileOpen}
        className={cn(
          "bg-card border-r border-border flex flex-col sticky top-0 h-screen overflow-hidden transition-[width] duration-200 ease-out",
          collapsed ? "w-16" : "w-[248px]",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:h-svh max-md:w-[248px] max-md:transition-transform",
          "max-md:data-[mobile-open=false]:-translate-x-full max-md:data-[mobile-open=true]:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 py-4 border-b border-border min-h-16",
            collapsed ? "flex-col px-2" : "px-[18px]",
          )}
        >
          {collapsed ? (
            <div className="w-[30px] h-[30px] rounded-lg grid place-items-center overflow-hidden shrink-0 bg-card">
              <Image
                src={theme === "dark" ? "/favicon-dark.png" : "/favicon-light.png"}
                alt="Polizing"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex-1 min-w-0",
                // El logo horizontal no contrasta sobre fondo oscuro: le damos
                // un fondo claro en modo oscuro.
                theme === "dark" && "bg-white rounded-md px-2 py-1",
              )}
            >
              <Image
                src="/logo-horizontal.png"
                alt="Polizing"
                width={180}
                height={36}
                className="object-contain h-9 w-auto"
                priority
              />
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir" : "Colapsar"}
            className={cn(
              "hidden md:grid place-items-center border border-border bg-card rounded-md text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0",
              collapsed ? "w-10 h-10" : "ml-auto w-7 h-7",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="px-[18px] pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/70">
            Operación
          </div>
        )}
        <nav className="flex flex-col px-2.5 py-1 gap-0.5 flex-1 overflow-y-auto">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.matchPrefix);
            const badge = badges[item.id];
            return (
              <Link
                key={item.id}
                href={item.href}
                data-active={active}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-2.5 py-2 rounded-md text-[13.5px] font-medium border border-transparent",
                  "text-brand-fg-2 hover:bg-brand-surface-hover hover:text-foreground",
                  "data-[active=true]:bg-brand-primary-soft data-[active=true]:text-primary data-[active=true]:font-semibold",
                  collapsed && "justify-center px-2.5",
                )}
              >
                <Icon className="w-[17px] h-[17px] shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                {badge ? (
                  <span
                    className={cn(
                      "font-mono font-semibold rounded-full bg-destructive text-white",
                      collapsed
                        ? "absolute top-0.5 right-0.5 min-w-4 px-1 py-px text-[9.5px]"
                        : "ml-auto px-1.5 py-px text-[11px]",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="px-[18px] pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/70">
            Configuración
          </div>
        )}
        <div className="px-2.5 pb-3">
          <button
            type="button"
            title={collapsed ? "Ajustes" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-[13.5px] font-medium text-brand-fg-2 hover:bg-brand-surface-hover hover:text-foreground",
              collapsed && "justify-center",
            )}
          >
            <Settings className="w-[17px] h-[17px] shrink-0" />
            {!collapsed && <span>Ajustes</span>}
          </button>
        </div>

        <div className="border-t border-border p-3 flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-brand-primary-soft text-primary grid place-items-center font-semibold text-[12.5px] shrink-0">
            {userInitials(user) || "U"}
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0 flex-1">
              <b className="text-[13px] font-semibold block text-foreground truncate">
                {user.name}
              </b>
              <small className="text-[11px] text-muted-foreground">{user.role}</small>
            </div>
          )}
          <SignOutButton redirectUrl="/login">
            <button
              type="button"
              title="Cerrar sesión"
              className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0"
            >
              <Logout className="w-3.5 h-3.5" />
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
