"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/generated/prisma/client";

const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.nativeEnum(Role),
});

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRole(["ADMIN"]);

    const parsed = updateUserRoleSchema.safeParse({ userId, role });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    });

    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("updateUserRole error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}

export async function getAllUsers() {
  try {
    await requireRole(["ADMIN"]);

    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return { success: true as const, users };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getAllUsers error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}
