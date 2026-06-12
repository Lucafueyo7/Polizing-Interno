export type Role = "Productor" | "Administrativo" | "sin_acceso";

export type SessionUser = {
  id?: number;
  email: string;
  name: string;
  role: Role;
};
