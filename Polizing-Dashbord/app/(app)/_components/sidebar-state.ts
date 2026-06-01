"use client";

import { useSyncExternalStore } from "react";

const COLLAPSED_KEY = "polizing-sidebar-collapsed";

const collapsedSubs = new Set<() => void>();
const mobileSubs = new Set<() => void>();
let mobileOpenState = false;

function emit(subs: Set<() => void>) {
  for (const cb of subs) cb();
}

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSED_KEY) === "true";
}

export function toggleCollapsed() {
  const next = !readCollapsed();
  window.localStorage.setItem(COLLAPSED_KEY, String(next));
  emit(collapsedSubs);
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(
    (cb) => {
      collapsedSubs.add(cb);
      return () => {
        collapsedSubs.delete(cb);
      };
    },
    readCollapsed,
    () => false,
  );
}

export function setMobileOpen(next: boolean) {
  if (mobileOpenState === next) return;
  mobileOpenState = next;
  emit(mobileSubs);
}

export function toggleMobile() {
  setMobileOpen(!mobileOpenState);
}

export function useMobileOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      mobileSubs.add(cb);
      return () => {
        mobileSubs.delete(cb);
      };
    },
    () => mobileOpenState,
    () => false,
  );
}
