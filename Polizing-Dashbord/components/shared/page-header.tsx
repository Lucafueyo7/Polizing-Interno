import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
