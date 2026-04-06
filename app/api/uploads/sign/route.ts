import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { buildAttachmentKey, createSignedUploadUrl } from "@/lib/storage";
import { isAllowedImageContentType } from "@/lib/security";
import { getCurrentUser } from "@/lib/session";

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isAllowedImageContentType, "Vain tuetut kuvatyypit sallitaan."),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Cookie",
        },
      },
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Forbidden" },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Cookie",
        },
      },
    );
  }

  try {
    const body = uploadRequestSchema.parse(await request.json());
    const storageKey = buildAttachmentKey(user.id, body.fileName);
    const uploadUrl = await createSignedUploadUrl(storageKey, body.contentType);

    return NextResponse.json(
      {
        storageKey,
        uploadUrl,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Vary: "Cookie",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ZodError
            ? "Virheellinen latauspyyntö."
            : "Latausosoitetta ei voitu luoda.",
      },
      {
        status: error instanceof ZodError ? 400 : 500,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Cookie",
        },
      },
    );
  }
}
