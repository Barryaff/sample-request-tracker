import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser();
  if (!allowedRoles.includes(user.role) && user.role !== "ADMIN") {
    throw new Error("Unauthorized: insufficient role");
  }
  return user;
}
