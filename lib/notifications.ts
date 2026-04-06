import {
  NotificationType,
  Prisma,
  Role,
  type Job,
  type Reminder,
  type User,
} from "@prisma/client";
import { Resend } from "resend";

import { env } from "@/lib/env";
import { formatPerson } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const resend =
  env.resendApiKey && !env.resendApiKey.startsWith("dev-")
    ? new Resend(env.resendApiKey)
    : null;

type NotificationSeed = {
  actor: Pick<User, "id" | "name" | "email">;
  type: NotificationType;
  subject: string;
  body: string;
  recipients: string[];
  payload?: Prisma.InputJsonValue;
  jobId?: string;
  linkPath?: string;
};

const sendEmail = async (to: string[], subject: string, body: string) => {
  if (!resend || to.length === 0) {
    return;
  }

  await resend.emails.send({
    from: env.authEmailFrom,
    to,
    subject,
    text: body,
  });
};

const createNotificationBatch = async ({
  actor,
  type,
  subject,
  body,
  recipients,
  payload,
  jobId,
  linkPath,
}: NotificationSeed) => {
  const uniqueRecipients = [...new Set(recipients)].filter(
    (recipient) => recipient && recipient !== actor.id,
  );

  if (uniqueRecipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: uniqueRecipients.map((recipient) => ({
      userId: recipient,
      jobId,
      type,
      payload: payload ?? {
        title: subject,
        body,
      },
    })),
  });

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueRecipients,
      },
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  await sendEmail(
    users.map((user) => user.email),
    subject,
    linkPath ? `${body}\n\nAvaa: ${env.appUrl}${linkPath}` : body,
  );
};

const getAdminIds = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: Role.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  return admins.map((admin) => admin.id);
};

export const notifyJobCreated = async (
  actor: Pick<User, "id" | "name" | "email">,
  job: Pick<Job, "id" | "title" | "status">,
) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await createNotificationBatch({
    actor,
    type: NotificationType.JOB_CREATED,
    subject: `Uusi keikka: ${job.title}`,
    body: `${formatPerson(actor)} lisäsi uuden keikan järjestelmään.`,
    recipients: users.map((user) => user.id),
    jobId: job.id,
    linkPath: `/keikat/${job.id}`,
  });
};

export const notifyJobClaimed = async (
  actor: Pick<User, "id" | "name" | "email">,
  job: Pick<Job, "id" | "title" | "status"> & { creatorId: string },
) => {
  const adminIds = await getAdminIds();

  await createNotificationBatch({
    actor,
    type: NotificationType.JOB_CLAIMED,
    subject: `Keikka työn alla: ${job.title}`,
    body: `${formatPerson(actor)} otti keikan työn alle.`,
    recipients: [job.creatorId, ...adminIds],
    jobId: job.id,
    linkPath: `/keikat/${job.id}`,
  });
};

export const notifyJobCompleted = async (
  actor: Pick<User, "id" | "name" | "email">,
  job: Pick<Job, "id" | "title" | "status"> & { creatorId: string },
) => {
  const adminIds = await getAdminIds();

  await createNotificationBatch({
    actor,
    type: NotificationType.JOB_COMPLETED,
    subject: `Keikka valmis: ${job.title}`,
    body: `${formatPerson(actor)} merkitsi keikan valmiiksi.`,
    recipients: [job.creatorId, ...adminIds],
    jobId: job.id,
    linkPath: `/keikat/${job.id}`,
  });
};

export const notifyJobHidden = async (
  actor: Pick<User, "id" | "name" | "email">,
  job: Pick<Job, "id" | "title" | "status"> & {
    creatorId: string;
    assigneeId: string | null;
  },
) => {
  const adminIds = await getAdminIds();

  await createNotificationBatch({
    actor,
    type: NotificationType.JOB_HIDDEN,
    subject: `Keikka piilotettu: ${job.title}`,
    body: `${formatPerson(actor)} piilotti keikan näkyvistä.`,
    recipients: [job.creatorId, job.assigneeId ?? "", ...adminIds],
    jobId: job.id,
    linkPath: `/keikat/${job.id}`,
  });
};

export const notifyJobReopened = async (
  actor: Pick<User, "id" | "name" | "email">,
  job: Pick<Job, "id" | "title" | "status"> & {
    creatorId: string;
    assigneeId: string | null;
  },
  message: string,
) => {
  const adminIds = await getAdminIds();

  await createNotificationBatch({
    actor,
    type: NotificationType.JOB_REOPENED,
    subject: `Keikka avattu uudelleen: ${job.title}`,
    body: `${formatPerson(actor)} ${message}`,
    recipients: [job.creatorId, job.assigneeId ?? "", ...adminIds],
    jobId: job.id,
    linkPath: `/keikat/${job.id}`,
  });
};

export const notifyReminderCompleted = async (
  actor: Pick<User, "id" | "name" | "email">,
  reminder: Pick<Reminder, "id" | "title" | "dueDate">,
) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  await createNotificationBatch({
    actor,
    type: NotificationType.REMINDER_COMPLETED,
    subject: `Muistutus tehty: ${reminder.title}`,
    body: `${formatPerson(actor)} kuittasi muistutuksen tehdyksi.`,
    recipients: users.map((user) => user.id),
    payload: {
      title: `Muistutus tehty: ${reminder.title}`,
      body: `${formatPerson(actor)} kuittasi muistutuksen tehdyksi.`,
      href: "/#muistutukset",
      actionLabel: "Avaa muistutukset",
    },
    linkPath: "/#muistutukset",
  });
};
