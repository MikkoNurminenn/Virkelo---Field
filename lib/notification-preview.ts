import { type NotificationType, type Prisma } from "@prisma/client";

import { notificationLabels } from "@/lib/constants";

type NotificationPayloadObject = {
  title?: unknown;
  body?: unknown;
};

type NotificationPreviewSource = {
  id: string;
  type: NotificationType;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
};

export type LiveNotificationPreview = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const getPayloadObject = (payload: Prisma.JsonValue | null) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload as NotificationPayloadObject;
};

const getTextValue = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const buildLiveNotificationPreview = ({
  id,
  type,
  payload,
  createdAt,
}: NotificationPreviewSource): LiveNotificationPreview => {
  const payloadObject = getPayloadObject(payload);
  const fallback = notificationLabels[type];

  return {
    id,
    title: getTextValue(payloadObject?.title) ?? fallback,
    body: getTextValue(payloadObject?.body) ?? fallback,
    createdAt: createdAt.toISOString(),
  };
};
