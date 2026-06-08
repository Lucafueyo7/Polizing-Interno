"use client";

import { useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";

const DARK = "/favicon-dark.png";
const LIGHT = "/favicon-light.png";

function setFavicon(href: string) {
  const el =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
  if (el) el.href = href;
}

export function FaviconTheme() {
  const { theme } = useTheme();

  useEffect(() => {
    setFavicon(theme === "dark" ? DARK : LIGHT);
  }, [theme]);

  return null;
}
