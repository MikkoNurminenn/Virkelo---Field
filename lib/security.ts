export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
] as const;

const attachmentKeyPattern =
  /^jobs\/\d{4}-\d{2}-\d{2}\/([a-z0-9_-]+)\/[a-f0-9-]+(?:\.[a-z0-9]+)?$/i;

export const isAllowedImageContentType = (value: string) =>
  ALLOWED_IMAGE_CONTENT_TYPES.includes(
    value.trim().toLowerCase() as (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number],
  );

export const isSafeRedirectPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

export const isAttachmentKeyOwnedByUser = (userId: string, storageKey: string) => {
  const match = attachmentKeyPattern.exec(storageKey);
  return match?.[1] === userId;
};

export const sanitizeDownloadFileName = (value?: string | null) => {
  const safeName =
    value
      ?.normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ?? "";

  return safeName || "attachment";
};
