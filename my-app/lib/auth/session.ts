"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USERS } from "./demo-users";
import type { Role, SessionUser } from "./types";

const SESSION_COOKIE = "polizing-session";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;

function inferRole(email: string): Role {
  return email.toLowerCase().includes("admin") ? "Administrativo" : "Productor";
}

function deriveName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function encode(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

function decode(value: string): SessionUser | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as Partial<SessionUser>;
    if (!parsed.email || !parsed.name || !parsed.role) return null;
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

async function persistSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Completá todos los campos." };
  }
  const known = DEMO_USERS.find((u) => u.email === email);
  const session: SessionUser = known ?? {
    email,
    name: deriveName(email),
    role: inferRole(email),
  };
  await persistSession(session);
  redirect("/dashboard");
}

export async function loginAsDemoUser(email: string) {
  const known = DEMO_USERS.find((u) => u.email === email);
  if (!known) return;
  await persistSession(known);
  redirect("/dashboard");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
