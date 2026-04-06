import type { NextAuthConfig } from "next-auth";

// Lightweight config used in middleware (Edge runtime — no Prisma)
export const authConfig = {
  pages: {
    signIn: "/kirjaudu",
    verifyRequest: "/kirjaudu?tila=lahetetty",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
