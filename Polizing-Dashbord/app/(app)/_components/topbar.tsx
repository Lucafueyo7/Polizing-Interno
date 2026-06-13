import { Breadcrumb } from "./breadcrumb";
import { GlobalSearch } from "./global-search";
import { MobileMenuTrigger } from "./mobile-menu-trigger";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 md:px-7 gap-2 md:gap-4 sticky top-0 z-10">
      <MobileMenuTrigger />
      <Breadcrumb />
      <GlobalSearch />
      <div className="ml-auto md:ml-0 flex items-center gap-2 md:gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
