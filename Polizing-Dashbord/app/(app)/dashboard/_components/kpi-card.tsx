import type { ComponentType, SVGProps } from "react";
import { TrendDown, TrendUp } from "@/components/icons";
import { Sparkline } from "@/components/shared/sparkline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type KpiCardProps = {
  label: string;
  icon: IconComponent;
  value: string;
  valueClassName?: string;
  trend: {
    direction: "up" | "down";
    text: string;
  };
  sparkline: {
    values: number[];
    color: string;
  };
};

export function KpiCard({
  label,
  icon: Icon,
  value,
  valueClassName,
  trend,
  sparkline,
}: KpiCardProps) {
  const TrendIcon = trend.direction === "up" ? TrendUp : TrendDown;
  const trendClass =
    trend.direction === "up" ? "text-brand-success" : "text-brand-warn";

  return (
    <Card className="p-4 gap-2.5">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "text-[26px] font-semibold tracking-[-0.02em] text-foreground leading-none",
          valueClassName,
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-[11.5px] font-medium",
          trendClass,
        )}
      >
        <TrendIcon className="w-3 h-3" />
        {trend.text}
      </div>
      <div className="mt-1 -mx-1">
        <Sparkline
          values={sparkline.values}
          color={sparkline.color}
          width={220}
          height={36}
        />
      </div>
    </Card>
  );
}
