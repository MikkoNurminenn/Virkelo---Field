import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "pgp-operointi",
    timestamp: new Date().toISOString(),
  });
}
