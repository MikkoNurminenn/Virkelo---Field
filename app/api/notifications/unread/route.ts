import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildLiveNotificationPreview } from "@/lib/notification-preview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const [user, unreadCount, latestUnreadNotification] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        isActive: true,
      },
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    }),
    prisma.notification.findFirst({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user?.isActive) {
    return NextResponse.json(
      {
        error: "Forbidden",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      unreadCount,
      latestNotification: latestUnreadNotification
        ? buildLiveNotificationPreview(latestUnreadNotification)
        : null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
