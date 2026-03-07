"use server";

import { signOut } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function signOutAction(): Promise<void> {
  try {
    await signOut({ redirectTo: "/auth/signin" });
  } catch (error) {
    // NextAuth signOut triggers a redirect which Next.js implements by
    // throwing a special error. Re-throw so the framework handles it.
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("signOutAction error:", error);
  }
}
