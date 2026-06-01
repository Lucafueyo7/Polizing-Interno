import type { ComponentType, SVGProps } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 text-muted-foreground">
      <Icon className="w-8 h-8 opacity-50 mb-2" />
      <div className="font-semibold text-brand-fg-2">{title}</div>
      {subtitle && <div className="text-[13px] mt-1">{subtitle}</div>}
    </div>
  );
}
