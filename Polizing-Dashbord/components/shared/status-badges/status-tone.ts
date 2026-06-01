import type { StatusTone } from "@/lib/domain/poliza-status";

export type BadgeToneVariant =
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "neutral";

export function toneToBadgeVariant(tone: StatusTone): BadgeToneVariant {
  return tone;
}
