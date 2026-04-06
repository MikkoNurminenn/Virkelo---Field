import { Role } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import type { JWT } from "next-auth/jwt";

import { env, isAdminEmail, isEmailAllowed } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const isDevelopmentLanUrl = (value: string) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" &&
      (
        /^(localhost|127\.0\.0\.1)$/.test(url.hostname) ||
        /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(url.hostname)
      )
    );
  } catch {
    return false;
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: env.authSecret,
  pages: {
    signIn: "/kirjaudu",
    verifyRequest: "/kirjaudu?tila=lahetetty",
  },
  providers: [
    ...(process.env.NODE_ENV !== "production"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev login",
            credentials: {
              email: {
                label: "Email",
                type: "email",
              },
            },
            async authorize(credentials) {
              const email =
                typeof credentials?.email === "string"
                  ? credentials.email.trim().toLowerCase()
                  : "";

              if (!email) {
                return null;
              }

              const existingUser = await prisma.user.findUnique({
                where: {
                  email,
                },
                select: {
                  id: true,
                  isActive: true,
                },
              });

              if (existingUser && !existingUser.isActive) {
                return null;
              }

              if (!existingUser && !isEmailAllowed(email)) {
                return null;
              }

              const user = await prisma.user.upsert({
                where: {
                  email,
                },
                update: {
                  role: isAdminEmail(email) ? Role.ADMIN : undefined,
                },
                create: {
                  email,
                  name: email.split("@")[0] ?? email,
                  role: isAdminEmail(email) ? Role.ADMIN : Role.USER,
                },
              });

              if (!user.isActive) {
                return null;
              }

              return user;
            },
          }),
        ]
      : []),
    Resend({
      apiKey: env.resendApiKey ?? "missing-resend-key",
      from: env.authEmailFrom,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const applyUser = (
        draft: JWT,
        source: {
          id?: string;
          email?: string | null;
          name?: string | null;
          role?: Role;
          isActive?: boolean;
        },
      ) => {
        if (source.id) {
          draft.sub = source.id;
        }

        if (source.email) {
          draft.email = source.email;
        }

        if (source.name) {
          draft.name = source.name;
        }

        if (source.role) {
          draft.role = source.role;
        }

        if (typeof source.isActive === "boolean") {
          draft.isActive = source.isActive;
        }

        return draft;
      };

      if (user) {
        return applyUser(token, user as typeof user & { role?: Role; isActive?: boolean });
      }

      if (!token.email) {
        return token;
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email: token.email.toLowerCase(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!existingUser) {
        return token;
      }

      return applyUser(token, existingUser);
    },
    async signIn({ user }) {
      const normalizedEmail = (user.email ?? "").toLowerCase();

      if (!normalizedEmail) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (existingUser && !existingUser.isActive) {
        return false;
      }

      if (!existingUser && !isEmailAllowed(normalizedEmail)) {
        return false;
      }

      if (existingUser && isAdminEmail(normalizedEmail) && existingUser.role !== Role.ADMIN) {
        await prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            role: Role.ADMIN,
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.isActive = (token.isActive as boolean | undefined) ?? true;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return new URL(url, baseUrl).toString();
      }

      if (isDevelopmentLanUrl(url)) {
        return url;
      }

      try {
        if (new URL(url).origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !isAdminEmail(user.email)) {
        return;
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          role: Role.ADMIN,
        },
      });
    },
  },
});
