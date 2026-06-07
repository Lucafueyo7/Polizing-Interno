import {
  Dashboard,
  UserPlus,
  Users,
  Building,
  Shield,
  AlertIcon,
  Wallet,
  Newspaper,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

export type NavItemId =
  | "dashboard"
  | "clientes"
  | "aseguradoras"
  | "polizas"
  | "siniestros"
  | "pagos"
  | "noticias"
  | "usuarios";

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * `pathname` candidates that should mark this item as active. Útil cuando una
   * sección incluye varias rutas (`/clientes`, `/clientes/[id]`).
   */
  matchPrefix: string;
  /** Si es true, solo se muestra a usuarios con rol Administrativo. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    id: "dashboard",
    label: "Panel de Control",
    href: "/dashboard",
    icon: Dashboard,
    matchPrefix: "/dashboard",
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    matchPrefix: "/clientes",
  },
  {
    id: "aseguradoras",
    label: "Aseguradoras",
    href: "/aseguradoras",
    icon: Building,
    matchPrefix: "/aseguradoras",
  },
  {
    id: "polizas",
    label: "Pólizas",
    href: "/polizas",
    icon: Shield,
    matchPrefix: "/polizas",
  },
  {
    id: "siniestros",
    label: "Siniestros",
    href: "/siniestros",
    icon: AlertIcon,
    matchPrefix: "/siniestros",
  },
  {
    id: "pagos",
    label: "Pagos masivos",
    href: "/pagos",
    icon: Wallet,
    matchPrefix: "/pagos",
  },
  {
    id: "noticias",
    label: "Noticias",
    href: "/noticias",
    icon: Newspaper,
    matchPrefix: "/noticias",
  },
  {
    id: "usuarios",
    label: "Usuarios",
    href: "/usuarios",
    icon: UserPlus,
    matchPrefix: "/usuarios",
    adminOnly: true,
  },
];
