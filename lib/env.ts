import "server-only";

import { brand } from "@/lib/brand";

const splitCsv = (value?: string) =>
  value
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];

export const env = {
  authSecret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-secret-change-me",
  authEmailFrom: process.env.AUTH_EMAIL_FROM ?? brand.emailFrom,
  resendApiKey: process.env.RESEND_API_KEY,
  appUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  adminEmails: splitCsv(process.env.ADMIN_EMAILS),
  allowedEmailDomains: splitCsv(process.env.ALLOWED_EMAIL_DOMAINS),
  allowedEmails: splitCsv(process.env.ALLOWED_EMAILS),
  bucketEndpoint:
    process.env.S3_ENDPOINT ?? process.env.AWS_ENDPOINT_URL_S3 ?? process.env.AWS_ENDPOINT_URL,
  bucketRegion: process.env.S3_REGION ?? process.env.AWS_REGION ?? "eu-west-1",
  bucketName: process.env.S3_BUCKET ?? process.env.BUCKET_NAME,
  bucketAccessKeyId:
    process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID,
  bucketSecretAccessKey:
    process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY,
};

if (
  process.env.NODE_ENV === "production" &&
  env.authSecret === "dev-secret-change-me"
) {
  throw new Error(
    "AUTH_SECRET environment variable must be set in production. " +
    "Generate one with: openssl rand -base64 32",
  );
}

export const isAdminEmail = (email: string) =>
  env.adminEmails.includes(email.trim().toLowerCase());

export const isEmailAllowed = (email: string) => {
  const normalized = email.trim().toLowerCase();

  if (isAdminEmail(normalized)) {
    return true;
  }

  if (env.allowedEmails.length > 0) {
    return env.allowedEmails.includes(normalized);
  }

  if (env.allowedEmailDomains.length > 0) {
    const domain = normalized.split("@")[1] ?? "";
    return env.allowedEmailDomains.includes(domain);
  }

  return process.env.NODE_ENV !== "production";
};

export const hasStorageConfig = () =>
  Boolean(
    env.bucketEndpoint &&
      env.bucketName &&
      env.bucketAccessKeyId &&
      env.bucketSecretAccessKey,
  );
