import {
  JobAttachmentKind,
  JobEntryType,
  JobStatus,
  NotificationType,
  ReminderStatus,
  Role,
} from "@prisma/client";

export const CUSTOMER_DEFAULT = "Helsingin kaupunki";

export const jobStatusLabels: Record<JobStatus, string> = {
  OPEN: "Avoin",
  IN_PROGRESS: "Työn alla",
  COMPLETED: "Valmis",
  CANCELLED: "Peruttu",
};

export const jobStatusTone: Record<JobStatus, string> = {
  OPEN: "border border-border bg-muted text-foreground",
  IN_PROGRESS: "border border-primary/50 bg-primary/20 text-foreground",
  COMPLETED: "border border-accent/50 bg-accent/25 text-accent-foreground",
  CANCELLED: "border border-destructive/40 bg-destructive/10 text-destructive",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  USER: "Käyttäjä",
};

export const attachmentKindLabels: Record<JobAttachmentKind, string> = {
  REFERENCE: "Lähtökuva",
  WORK: "Työkuva",
  BEFORE: "Ennen",
  AFTER: "Jälkeen",
};

export const jobEntryTypeLabels: Record<JobEntryType, string> = {
  NOTE: "Muistiinpano",
  STATUS_CHANGE: "Tilapäivitys",
  COMPLETION_REPORT: "Valmistumisraportti",
};

export const notificationLabels: Record<NotificationType, string> = {
  JOB_CREATED: "Uusi keikka",
  JOB_CLAIMED: "Keikka otettiin työn alle",
  JOB_COMPLETED: "Keikka merkittiin valmiiksi",
  JOB_HIDDEN: "Keikka piilotettiin",
  JOB_REOPENED: "Keikka avattiin uudelleen",
  REMINDER_COMPLETED: "Muistutus merkittiin tehdyksi",
  USER_STATUS_CHANGED: "Käyttäjän tila muuttui",
};

export const reminderStatusLabels: Record<ReminderStatus, string> = {
  OPEN: "Avoin",
  COMPLETED: "Tehty",
};

export const activeJobStatuses = [JobStatus.OPEN, JobStatus.IN_PROGRESS];
export const archivedJobStatuses = [JobStatus.COMPLETED, JobStatus.CANCELLED];
