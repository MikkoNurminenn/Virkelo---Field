import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /kirjaudu (sign-in page)
     * - /api/auth/* (NextAuth endpoints)
     * - /api/health (health check, no auth needed)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /virkelo-mark.svg (static assets)
     */
    "/((?!kirjaudu|api/auth|api/health|_next/static|_next/image|favicon\\.ico|virkelo-mark\\.svg).*)",
  ],
};
