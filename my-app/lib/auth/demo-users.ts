import type { SessionUser } from "./types";

/**
 * Usuarios prearmados para acceso rápido en la pantalla de login.
 * Coinciden con los del prototipo de Claude Design.
 */
export const DEMO_USERS: ReadonlyArray<SessionUser> = [
  {
    name: "Mariano Pereyra",
    email: "mariano@polizing.com.ar",
    role: "Productor",
  },
  {
    name: "Lucía Bertotto",
    email: "lucia.admin@polizing.com.ar",
    role: "Administrativo",
  },
];
