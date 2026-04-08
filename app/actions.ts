"use server";

import {
  JobAttachmentKind,
  JobEntryType,
  JobStatus,
  ReminderStatus,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  notifyJobClaimed,
  notifyJobCompleted,
  notifyJobCreated,
  notifyJobHidden,
  notifyJobReopened,
  notifyReminderCompleted,
} from "@/lib/notifications";
import {
  canCancelJob,
  canCompleteJob,
  canCompleteReminder,
  canCreateReminder,
  canEditJob,
  canHideJob,
  canManageUsers,
  canReleaseJob,
  canReopenJob,
  canTakeJob,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { parseAttachmentForm, parseCompleteJobForm, parseCreateJobForm, parseCreateReminderForm, parseNoteForm, parseReminderActionForm, parseUpdateJobForm, parseUserToggleForm, parseWorkLogForm, uploadedAttachmentSchema } from "@/lib/schemas";
import { isAttachmentKeyOwnedByUser } from "@/lib/security";
import { requireCurrentUser } from "@/lib/session";

const refreshApp = (jobId?: string) => {
  revalidatePath("/");
  revalidatePath("/omat");
  revalidatePath("/arkisto");
  revalidatePath("/ilmoitukset");
  revalidatePath("/admin");
  revalidatePath("/keikat/uusi");

  if (jobId) {
    revalidatePath(`/keikat/${jobId}`);
  }
};

const parseJobId = (formData: FormData) => {
  const value = formData.get("jobId");

  if (!value || typeof value !== "string") {
    throw new Error("Keikka puuttuu.");
  }

  return value;
};

const parseNotificationId = (formData: FormData) => {
  const value = formData.get("notificationId");

  if (!value || typeof value !== "string") {
    throw new Error("Ilmoitus puuttuu.");
  }

  return value;
};

const assertOwnedAttachments = (
  userId: string,
  attachments: Array<{ storageKey: string }>,
) => {
  if (!attachments.every((attachment) => isAttachmentKeyOwnedByUser(userId, attachment.storageKey))) {
    throw new Error("Liitteiden omistus ei täsmää.");
  }
};

const parseUploadedAttachments = (formData: FormData, field: string, userId: string) => {
  const raw = formData.get(field);

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  const attachments = uploadedAttachmentSchema.array().parse(JSON.parse(raw));
  assertOwnedAttachments(userId, attachments);

  return attachments;
};

const getJobForAction = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      creatorId: true,
      assigneeId: true,
      hiddenAt: true,
    },
  });

  if (!job) {
    throw new Error("Keikkaa ei löytynyt.");
  }

  return job;
};

const getReminderForAction = async (reminderId: string) => {
  const reminder = await prisma.reminder.findUnique({
    where: {
      id: reminderId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      createdById: true,
    },
  });

  if (!reminder) {
    throw new Error("Muistutusta ei löytynyt.");
  }

  return reminder;
};

export const createJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseCreateJobForm(formData);
  assertOwnedAttachments(user.id, values.referenceAttachments);

  const job = await prisma.$transaction(async (tx) => {
    const createdJob = await tx.job.create({
      data: {
        title: values.title,
        description: values.description,
        jobNumber: values.jobNumber ?? null,
        address: values.address,
        area: values.area ?? null,
        scheduledDate: values.scheduledDate,
        technicianPhones: values.technicianPhones,
        notes: values.notes ?? null,
        customerName: values.customerName,
        creatorId: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
      },
    });

    if (values.referenceAttachments.length > 0) {
      await tx.jobAttachment.createMany({
        data: values.referenceAttachments.map((attachment) => ({
          jobId: createdJob.id,
          kind: JobAttachmentKind.REFERENCE,
          storageKey: attachment.storageKey,
          caption: attachment.fileName,
          uploadedById: user.id,
        })),
      });
    }

    await tx.jobEntry.create({
      data: {
        jobId: createdJob.id,
        authorId: user.id,
        type: JobEntryType.STATUS_CHANGE,
        message: "Keikka luotiin avoimeksi.",
        metadata: {
          to: JobStatus.OPEN,
        },
      },
    });

    return createdJob;
  });

  await notifyJobCreated(user, job);
  refreshApp(job.id);
  redirect(`/keikat/${job.id}`);
};

export const updateJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseUpdateJobForm(formData);
  const job = await getJobForAction(values.jobId);

  if (!canEditJob(user, job)) {
    throw new Error("Sinulla ei ole oikeutta muokata tätä keikkaa.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: {
        id: values.jobId,
      },
      data: {
        title: values.title,
        description: values.description,
        jobNumber: values.jobNumber ?? null,
        address: values.address,
        area: values.area ?? null,
        scheduledDate: values.scheduledDate,
        technicianPhones: values.technicianPhones,
        notes: values.notes ?? null,
        customerName: values.customerName,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId: values.jobId,
        authorId: user.id,
        type: JobEntryType.NOTE,
        message: "Perustietoja päivitettiin.",
      },
    });
  });

  refreshApp(values.jobId);
  redirect(`/keikat/${values.jobId}`);
};

export const takeJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const jobId = parseJobId(formData);
  const job = await getJobForAction(jobId);

  if (!canTakeJob(user, job)) {
    throw new Error("Keikkaa ei voi ottaa työn alle.");
  }

  const updatedJob = await prisma.$transaction(async (tx) => {
    const nextJob = await tx.job.update({
      where: {
        id: jobId,
      },
      data: {
        assigneeId: user.id,
        status: JobStatus.IN_PROGRESS,
      },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId,
        authorId: user.id,
        type: JobEntryType.STATUS_CHANGE,
        message: "Keikka otettiin työn alle.",
        metadata: {
          to: JobStatus.IN_PROGRESS,
        },
      },
    });

    return nextJob;
  });

  await notifyJobClaimed(user, updatedJob);
  refreshApp(jobId);
  redirect(`/keikat/${jobId}`);
};

export const releaseJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const jobId = parseJobId(formData);
  const job = await getJobForAction(jobId);

  if (!canReleaseJob(user, job)) {
    throw new Error("Keikkaa ei voi palauttaa avoimeksi.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: {
        id: jobId,
      },
      data: {
        assigneeId: null,
        status: JobStatus.OPEN,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId,
        authorId: user.id,
        type: JobEntryType.STATUS_CHANGE,
        message: "Keikka palautettiin avoimeksi.",
        metadata: {
          to: JobStatus.OPEN,
        },
      },
    });
  });

  refreshApp(jobId);
  redirect(`/keikat/${jobId}`);
};

export const completeJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseCompleteJobForm(formData);
  const attachments = parseUploadedAttachments(formData, "completionAttachments", user.id);
  const job = await getJobForAction(values.jobId);

  if (!canCompleteJob(user, job)) {
    throw new Error("Keikkaa ei voi merkitä valmiiksi.");
  }

  const updatedJob = await prisma.$transaction(async (tx) => {
    const nextJob = await tx.job.update({
      where: {
        id: values.jobId,
      },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        assigneeId: job.assigneeId ?? user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
      },
    });

    if (attachments.length > 0) {
      await tx.jobAttachment.createMany({
        data: attachments.map((attachment) => ({
          jobId: values.jobId,
          kind: JobAttachmentKind.AFTER,
          storageKey: attachment.storageKey,
          caption: attachment.fileName,
          uploadedById: user.id,
        })),
      });
    }

    await tx.jobEntry.create({
      data: {
        jobId: values.jobId,
        authorId: user.id,
        type: JobEntryType.COMPLETION_REPORT,
        message: values.workSummary,
        metadata: {
          additionalNotes: values.additionalNotes,
          attachmentCount: attachments.length,
        },
      },
    });

    return nextJob;
  });

  await notifyJobCompleted(user, updatedJob);
  refreshApp(values.jobId);
  redirect(`/keikat/${values.jobId}`);
};

export const reopenJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const jobId = parseJobId(formData);
  const job = await getJobForAction(jobId);

  if (!canReopenJob(user, job)) {
    throw new Error("Keikkaa ei voi avata uudelleen.");
  }

  const updatedJob = await prisma.$transaction(async (tx) => {
    const nextJob = await tx.job.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.OPEN,
        assigneeId: null,
        completedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
        assigneeId: true,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId,
        authorId: user.id,
        type: JobEntryType.STATUS_CHANGE,
        message: "Keikka avattiin uudelleen.",
        metadata: {
          to: JobStatus.OPEN,
        },
      },
    });

    return nextJob;
  });

  await notifyJobReopened(user, updatedJob, "avasi keikan uudelleen.");
  refreshApp(jobId);
  redirect(`/keikat/${jobId}`);
};

export const cancelJobAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const jobId = parseJobId(formData);
  const job = await getJobForAction(jobId);

  if (!canCancelJob(user, job)) {
    throw new Error("Keikkaa ei voi perua.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: {
        id: jobId,
      },
      data: {
        status: JobStatus.CANCELLED,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId,
        authorId: user.id,
        type: JobEntryType.STATUS_CHANGE,
        message: "Keikka peruttiin.",
        metadata: {
          to: JobStatus.CANCELLED,
        },
      },
    });
  });

  refreshApp(jobId);
  redirect(`/keikat/${jobId}`);
};

export const toggleJobVisibilityAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const jobId = parseJobId(formData);
  const job = await getJobForAction(jobId);

  if (!canHideJob(user)) {
    throw new Error("Vain admin voi piilottaa keikan.");
  }

  const nextHiddenAt = job.hiddenAt ? null : new Date();

  const updatedJob = await prisma.$transaction(async (tx) => {
    const nextJob = await tx.job.update({
      where: {
        id: jobId,
      },
      data: {
        hiddenAt: nextHiddenAt,
      },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
        assigneeId: true,
      },
    });

    await tx.jobEntry.create({
      data: {
        jobId,
        authorId: user.id,
        type: JobEntryType.NOTE,
        message: nextHiddenAt
          ? "Admin piilotti keikan."
          : "Admin palautti keikan näkyviin.",
      },
    });

    return nextJob;
  });

  if (nextHiddenAt) {
    await notifyJobHidden(user, updatedJob);
  } else {
    await notifyJobReopened(user, updatedJob, "palautti keikan näkyviin.");
  }

  refreshApp(jobId);
  redirect(`/keikat/${jobId}`);
};

export const addJobNoteAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseNoteForm(formData);
  const job = await getJobForAction(values.jobId);

  if (!canEditJob(user, job)) {
    throw new Error("Sinulla ei ole oikeutta lisätä muistiinpanoa.");
  }

  await prisma.jobEntry.create({
    data: {
      jobId: values.jobId,
      authorId: user.id,
      type: JobEntryType.NOTE,
      message: values.message,
    },
  });

  refreshApp(values.jobId);
  redirect(`/keikat/${values.jobId}`);
};

export const addJobWorkLogAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseWorkLogForm(formData);
  const receiptAttachments = parseUploadedAttachments(formData, "receiptAttachments", user.id);
  const job = await getJobForAction(values.jobId);

  if (!canEditJob(user, job)) {
    throw new Error("Sinulla ei ole oikeutta lisätä työpäiväkirjausta.");
  }

  if (!values.hours && !values.materials && !values.note && receiptAttachments.length === 0) {
    throw new Error("Lisää tunnit, tavaralista, huomio tai kuittikuva.");
  }

  await prisma.$transaction(async (tx) => {
    const createdReceipts = await Promise.all(
      receiptAttachments.map((attachment) =>
        tx.jobAttachment.create({
          data: {
            jobId: values.jobId,
            kind: JobAttachmentKind.RECEIPT,
            storageKey: attachment.storageKey,
            caption: attachment.fileName,
            uploadedById: user.id,
          },
          select: {
            id: true,
          },
        }),
      ),
    );

    await tx.jobEntry.create({
      data: {
        jobId: values.jobId,
        authorId: user.id,
        type: JobEntryType.WORK_LOG,
        message: "Työpäivä kirjattiin.",
        metadata: {
          workDate: values.workDate.toISOString(),
          hours: values.hours,
          materials: values.materials,
          note: values.note,
          receiptCount: createdReceipts.length,
          receiptAttachmentIds: createdReceipts.map((attachment) => attachment.id),
        },
      },
    });
  });

  refreshApp(values.jobId);
  redirect(`/keikat/${values.jobId}`);
};

export const addJobAttachmentsAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const values = parseAttachmentForm(formData);
  const attachments = parseUploadedAttachments(formData, "jobAttachments", user.id);
  const job = await getJobForAction(values.jobId);

  if (!canEditJob(user, job)) {
    throw new Error("Sinulla ei ole oikeutta lisätä kuvia.");
  }

  if (attachments.length === 0) {
    throw new Error("Lisää ainakin yksi kuva.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.jobAttachment.createMany({
      data: attachments.map((attachment) => ({
        jobId: values.jobId,
        kind: values.kind,
        storageKey: attachment.storageKey,
        caption: values.caption || attachment.fileName,
        uploadedById: user.id,
      })),
    });

    await tx.jobEntry.create({
      data: {
        jobId: values.jobId,
        authorId: user.id,
        type: JobEntryType.NOTE,
        message: `Lisättiin ${attachments.length} kuvaa.`,
        metadata: {
          kind: values.kind,
          caption: values.caption,
        },
      },
    });
  });

  refreshApp(values.jobId);
  redirect(`/keikat/${values.jobId}`);
};

export const createReminderAction = async (formData: FormData) => {
  const user = await requireCurrentUser();

  if (!canCreateReminder(user)) {
    throw new Error("Vain admin voi luoda muistutuksia.");
  }

  const values = parseCreateReminderForm(formData);

  await prisma.reminder.create({
    data: {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      createdById: user.id,
    },
  });

  refreshApp();
  redirect("/admin");
};

export const completeReminderAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const { reminderId, redirectTo } = parseReminderActionForm(formData);
  const reminder = await getReminderForAction(reminderId);

  if (!canCompleteReminder(user, reminder)) {
    throw new Error("Muistutusta ei voi merkitä tehdyksi.");
  }

  const completedReminder = await prisma.reminder.update({
    where: {
      id: reminderId,
    },
    data: {
      status: ReminderStatus.COMPLETED,
      completedAt: new Date(),
      completedById: user.id,
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
    },
  });

  await notifyReminderCompleted(user, completedReminder);
  refreshApp();
  redirect(redirectTo ?? "/");
};

export const markNotificationReadAction = async (formData: FormData) => {
  const user = await requireCurrentUser();
  const notificationId = parseNotificationId(formData);

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  refreshApp();
  redirect("/ilmoitukset");
};

export const markAllNotificationsReadAction = async () => {
  const user = await requireCurrentUser();

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  refreshApp();
  redirect("/ilmoitukset");
};

export const toggleUserActiveAction = async (formData: FormData) => {
  const actor = await requireCurrentUser();
  const { userId } = parseUserToggleForm(formData);

  if (!canManageUsers(actor)) {
    throw new Error("Vain admin voi hallita käyttäjiä.");
  }

  if (actor.id === userId) {
    throw new Error("Et voi muuttaa omaa käyttöoikeuttasi.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!target) {
    throw new Error("Käyttäjää ei löytynyt.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: !target.isActive,
      },
    });

    if (target.isActive) {
      await tx.session.deleteMany({
        where: {
          userId,
        },
      });
    }
  });

  refreshApp();
  redirect("/admin");
};

export const toggleUserRoleAction = async (formData: FormData) => {
  const actor = await requireCurrentUser();
  const { userId } = parseUserToggleForm(formData);

  if (!canManageUsers(actor)) {
    throw new Error("Vain admin voi hallita käyttäjiä.");
  }

  if (actor.id === userId) {
    throw new Error("Et voi muuttaa omaa rooliasi.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!target) {
    throw new Error("Käyttäjää ei löytynyt.");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: target.role === Role.ADMIN ? Role.USER : Role.ADMIN,
    },
  });

  refreshApp();
  redirect("/admin");
};
