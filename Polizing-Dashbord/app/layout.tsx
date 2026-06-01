import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-script";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polizing — Software de gestión integral",
  description:
    "Gestión centralizada para tu productora de seguros. Pólizas, clientes, aseguradoras y siniestros en un solo panel.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        data-theme="light"
        suppressHydrationWarning
        className={`${sans.variable} ${mono.variable} h-full antialiased`}
      >
        <body className="min-h-full">
          <script
            dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
            suppressHydrationWarning
          />
          <ThemeProvider>
            <Suspense>{children}</Suspense>
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
