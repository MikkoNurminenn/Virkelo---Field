import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/kirjaudu", req.url));
  }
});

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
