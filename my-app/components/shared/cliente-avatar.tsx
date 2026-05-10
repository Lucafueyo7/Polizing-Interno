import { cn } from "@/lib/utils";

type ClienteAvatarProps = {
  letters: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES: Record<NonNullable<ClienteAvatarProps["size"]>, string> = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-9 h-9 text-[12.5px]",
  lg: "w-12 h-12 text-[15px]",
};

export function ClienteAvatar({
  letters,
  size = "md",
  className,
}: ClienteAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-full bg-brand-primary-soft text-primary grid place-items-center font-semibold shrink-0 select-none",
        SIZES[size],
        className,
      )}
    >
      {letters}
    </span>
  );
}
