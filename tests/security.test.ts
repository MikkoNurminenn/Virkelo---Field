import { describe, expect, it } from "vitest";

import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  isAllowedImageContentType,
  isAttachmentKeyOwnedByUser,
  isSafeRedirectPath,
} from "@/lib/security";

describe("security helpers", () => {
  it("accepts only allowlisted image content types", () => {
    for (const contentType of ALLOWED_IMAGE_CONTENT_TYPES) {
      expect(isAllowedImageContentType(contentType)).toBe(true);
    }

    expect(isAllowedImageContentType("image/svg+xml")).toBe(false);
    expect(isAllowedImageContentType("text/html")).toBe(false);
  });

  it("allows only safe internal redirect paths", () => {
    expect(isSafeRedirectPath("/admin")).toBe(true);
    expect(isSafeRedirectPath("/keikat/uusi")).toBe(true);
    expect(isSafeRedirectPath("//evil.example")).toBe(false);
    expect(isSafeRedirectPath("https://evil.example")).toBe(false);
    expect(isSafeRedirectPath("/\\evil")).toBe(false);
  });

  it("ties attachment keys to the uploading user", () => {
    expect(
      isAttachmentKeyOwnedByUser(
        "user_123",
        "jobs/2026-04-05/user_123/1bfeb8c0-c1f4-4c77-a2f6-b0b2d7f6d8f9.jpg",
      ),
    ).toBe(true);

    expect(
      isAttachmentKeyOwnedByUser(
        "user_123",
        "jobs/2026-04-05/other_user/1bfeb8c0-c1f4-4c77-a2f6-b0b2d7f6d8f9.jpg",
      ),
    ).toBe(false);
  });
});
