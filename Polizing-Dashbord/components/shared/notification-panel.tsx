"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Coins,
  Close,
  Shield,
  Trash,
} from "@/components/icons";
import { cn } from "@/lib/utils";

type NotificationType = "siniestro" | "poliza" | "pago";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

const STORAGE_KEY = "polizing-notifications";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "siniestro",
    title: "Nuevo siniestro reportado",
    description: "Choque trasero · Sofía Mansilla",
    timestamp: "hace 2 h",
    read: false,
  },
  {
    id: "notif-2",
    type: "poliza",
    title: "Póliza por vencer",
    description: "HOG-309218 · La Federal Seguros",
    timestamp: "hace 4 h",
    read: false,
  },
  {
    id: "notif-3",
    type: "pago",
    title: "Pago masivo acreditado",
    description: "Frigorífico Las Heras · AR$ 5,21M",
    timestamp: "ayer",
    read: true,
  },
  {
    id: "notif-4",
    type: "siniestro",
    title: "Siniestro cerrado",
    description: "INC-2024-0423 · Daños materiales",
    timestamp: "ayer",
    read: false,
  },
];

const TYPE_META: Record<
  NotificationType,
  { icon: typeof AlertCircle; tone: string; label: string }
> = {
  siniestro: {
    icon: AlertCircle,
    tone: "bg-brand-warn-soft text-brand-warn",
    label: "Siniestro",
  },
  poliza: {
    icon: Shield,
    tone: "bg-brand-info-soft text-brand-info",
    label: "Póliza",
  },
  pago: {
    icon: Coins,
    tone: "bg-brand-success-soft text-brand-success",
    label: "Pago",
  },
};

export function NotificationPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NotificationItem[];
        setNotifications(Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATIONS);
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [hydrated, notifications]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const clearAll = () => {
    setNotifications([]);
    setOpen(false);
  };

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Notificaciones"
        aria-label="Notificaciones"
        onClick={() => setOpen((value) => !value)}
        className="relative w-9 h-9 grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] text-white font-semibold border-2 border-card flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[420px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg z-50">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Notificaciones
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                Últimos movimientos del sistema
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground"
              aria-label="Cerrar notificaciones"
            >
              <Close className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No hay notificaciones pendientes.
              </div>
            ) : (
              notifications.map((notification) => {
                const meta = TYPE_META[notification.type];
                const Icon = meta.icon;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-surface-hover",
                      !notification.read && "border-l-2 border-primary bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                        meta.tone,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-foreground truncate">
                          {notification.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {notification.timestamp}
                        </span>
                      </span>
                      <span className="mt-0.5 text-[12px] text-muted-foreground truncate block">
                        {notification.description}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {meta.label}
                        {!notification.read && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <CheckCircle className="w-3 h-3" />
                            Sin leer
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={clearAll}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-brand-surface-hover transition-colors"
            >
              <Trash className="w-4 h-4" />
              Borrar notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
