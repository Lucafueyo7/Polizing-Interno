"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Paperclip, WhatsApp } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { SiniestroBadge } from "@/components/shared/status-badges/siniestro-badge";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format/time-ago";
import { cn } from "@/lib/utils";
import type { SiniestroListItem } from "@/lib/data/types";

export function InboxItem({ item }: { item: SiniestroListItem }) {
  const pathname = usePathname();
  const isActive = pathname === `/siniestros/${item.id}`;
  const unread = !item.leidoPorMi;

  return (
    <Link
      href={`/siniestros/${item.id}`}
      data-active={isActive}
      data-unread={unread}
      className={cn(
        "block px-4 py-3 border-b border-border hover:bg-brand-surface-hover transition-colors",
        "data-[active=true]:bg-brand-primary-soft data-[active=true]:border-l-2 data-[active=true]:border-l-primary",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <ClienteAvatar letters={item.cliente.avatarLetters} size="sm" />
        <span
          className={cn(
            "text-[12.5px] truncate flex-1 min-w-0",
            unread ? "font-semibold text-foreground" : "text-brand-fg-2",
          )}
        >
          {item.cliente.label}
        </span>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {timeAgo(item.fechaReporte)}
        </span>
      </div>
      <div
        className={cn(
          "text-[13px] truncate mb-1.5",
          unread ? "font-semibold text-foreground" : "text-foreground",
        )}
      >
        {item.titulo ?? "Sin título"}
      </div>
      <div className="flex items-center gap-1.5">
        <SiniestroBadge estado={item.estado} />
        <Badge variant="whatsapp" className="h-4 px-1.5 text-[10px]">
          <WhatsApp className="w-2.5 h-2.5" />
          WhatsApp
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Paperclip className="w-3 h-3" />
          {item.docsCount}
        </span>
      </div>
    </Link>
  );
}
