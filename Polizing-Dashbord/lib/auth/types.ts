export type Role = "Productor" | "Administrativo";

export type SessionUser = {
  id?: number;
  email: string;
  name: string;
  role: Role;
};
