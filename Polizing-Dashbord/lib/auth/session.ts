import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Role, SessionUser } from "./types";

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

async function resolveUserId(email: string): Promise<number | undefined> {
  try {
    const dbUser = await prisma.usuarios.findUnique({
      where: { email },
      select: { id: true },
    });
    return dbUser?.id;
  } catch {
    return undefined;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  if (!email) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const name = fullName || deriveName(email);
  const metadataRole = (user.publicMetadata?.role as Role | undefined) ?? null;
  const role: Role = metadataRole ?? inferRole(email);

  return { id: await resolveUserId(email), email, name, role };
}
