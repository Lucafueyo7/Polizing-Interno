import { Bell, Help, Search } from "@/components/icons";
import { Breadcrumb } from "./breadcrumb";
import { MobileMenuTrigger } from "./mobile-menu-trigger";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 md:px-7 gap-2 md:gap-4 sticky top-0 z-10">
      <MobileMenuTrigger />
      <Breadcrumb />
      <div className="ml-auto relative w-[320px] hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar clientes, pólizas, siniestros..."
          className="w-full h-9 border border-border bg-brand-surface-2 rounded-lg pl-9 pr-12 outline-none text-[13px] focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(15,39,68,.08)] transition-colors"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">
          ⌘ K
        </span>
      </div>
      <div className="ml-auto md:ml-0 flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <button
          type="button"
          title="Notificaciones"
          className="relative w-9 h-9 grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-destructive rounded-full border-2 border-card" />
        </button>
        <button
          type="button"
          title="Ayuda"
          className="w-9 h-9 hidden sm:grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0"
        >
          <Help className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
