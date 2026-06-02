"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FormModalShellProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description?: string;
  /** Tailwind max-width override, ej. `sm:max-w-[760px]`. */
  maxWidthClass?: string;
  children: ReactNode;
};

export function FormModalShell({
  open,
  onOpenChange,
  title,
  description,
  maxWidthClass = "sm:max-w-[640px]",
  children,
}: FormModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-[calc(100%-2rem)]", maxWidthClass)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="overflow-y-auto overflow-x-hidden max-h-[65dvh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
