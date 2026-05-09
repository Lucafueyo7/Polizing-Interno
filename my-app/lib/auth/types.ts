export type Role = "Productor" | "Administrativo";

export type SessionUser = {
  email: string;
  name: string;
  role: Role;
};
