import { NextResponse } from "next/server";

import { getStoredObject } from "@/lib/storage";
import { canViewJob } from "@/lib/permissions";
import { isAllowedImageContentType, sanitizeDownloadFileName } from "@/lib/security";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const attachment = await prisma.jobAttachment.findUnique({
    where: {
      id: attachmentId,
    },
    select: {
      storageKey: true,
      caption: true,
      job: {
        select: {
          creatorId: true,
          assigneeId: true,
          hiddenAt: true,
          status: true,
        },
      },
    },
  });

  if (!attachment || !canViewJob(user, attachment.job)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const object = await getStoredObject(attachment.storageKey);
  const bytes = await object.Body?.transformToByteArray();
  const contentType = object.ContentType ?? "application/octet-stream";
  const isSafeInlineImage = isAllowedImageContentType(contentType);
  const fileName = sanitizeDownloadFileName(attachment.caption);

  return new NextResponse(bytes ? Buffer.from(bytes) : null, {
    status: 200,
    headers: {
      "Content-Type": isSafeInlineImage ? contentType : "application/octet-stream",
      "Cache-Control": "private, max-age=120",
      "Content-Disposition": `${isSafeInlineImage ? "inline" : "attachment"}; filename="${fileName}"`,
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data: blob:; sandbox;",
      "X-Content-Type-Options": "nosniff",
      Vary: "Cookie",
    },
  });
}
