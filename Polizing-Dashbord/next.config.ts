import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hay lockfiles en el directorio padre (C:\Polizing-Interno\), por eso Turbopack
  // infiere mal el workspace root y no encuentra el paquete `next`. Lo fijamos al
  // directorio del proyecto.
  turbopack: {
    root: __dirname,
  },
  typescript: {
    // HACK: Next.js 16 internal validator bug with catch-all [[...sign-in]] routes.
    // Generated `.next/dev/types/validator.ts` looks for `(auth)/login/page.js`
    // but the file is at `(auth)/login/[[...sign-in]]/page.tsx`.
    // Remove when Next.js fixes upstream.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
