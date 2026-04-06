import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/kirjaudu", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /kirjaudu (sign-in page)
     * - /api/auth/* (NextAuth endpoints)
     * - /api/health (health check)
     * - /_next/* (Next.js internals)
     * - static assets
     */
    "/((?!kirjaudu|api/auth|api/health|_next/static|_next/image|favicon\\.ico|virkelo-mark\\.svg).*)",
  ],
};
