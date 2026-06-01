import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type ClienteTipoCardProps = {
  selected: boolean;
  icon: IconComponent;
  title: string;
  desc: string;
  onClick: () => void;
};

export function ClienteTipoCard({
  selected,
  icon: Icon,
  title,
  desc,
  onClick,
}: ClienteTipoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-colors",
        selected
          ? "border-primary bg-brand-primary-soft"
          : "border-border bg-card hover:bg-brand-surface-hover",
      )}
    >
      <span
        className={cn(
          "w-8 h-8 grid place-items-center rounded-md shrink-0",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "text-[13px] font-semibold",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </span>
        <span className="text-[11.5px] text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
