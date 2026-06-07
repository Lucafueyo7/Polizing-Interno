import { Search } from "@/components/icons";
import { NotificationPanel } from "@/components/shared/notification-panel";
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
      </div>
      <div className="ml-auto md:ml-0 flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <NotificationPanel />
      </div>
    </header>
  );
}
