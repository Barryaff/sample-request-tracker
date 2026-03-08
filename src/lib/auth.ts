import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const providers: NextAuthConfig["providers"] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  }),
];

// Dev-only credentials provider for local testing
if (process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@test.com" },
        name: { label: "Name", type: "text", placeholder: "Test Admin" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const name = (credentials?.name as string) || "Test User";

        if (!email) return null;

        // Find or create the user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              role: "ADMIN",
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  );
}

const config = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers,
  session: {
    strategy: process.env.NODE_ENV === "development" ? "jwt" : "database",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (token) {
        // JWT mode (dev with credentials)
        session.user.id = token.sub!;
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub! } });
        if (dbUser) {
          session.user.role = dbUser.role;
        }
      } else if (user) {
        // Database mode (production with Google)
        session.user.id = user.id;
        session.user.role = (user as { role: string }).role as typeof session.user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
