import { JobStatus, ReminderStatus, Role } from "@prisma/client";

type UserLike = {
  id: string;
  role: Role;
  isActive: boolean;
};

type JobLike = {
  creatorId: string;
  assigneeId: string | null;
  hiddenAt: Date | null;
  status: JobStatus;
};

export const isAdmin = (user: UserLike) => user.role === Role.ADMIN;

export const canViewJob = (user: UserLike, job: JobLike) => {
  if (!user.isActive) {
    return false;
  }

  if (!job.hiddenAt) {
    return true;
  }

  return (
    isAdmin(user) || user.id === job.creatorId || user.id === job.assigneeId
  );
};

export const canEditJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  (isAdmin(user) || user.id === job.creatorId || user.id === job.assigneeId);

export const canTakeJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  !job.hiddenAt &&
  job.status === JobStatus.OPEN &&
  !job.assigneeId;

export const canReleaseJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  job.status !== JobStatus.COMPLETED &&
  job.status !== JobStatus.CANCELLED &&
  (isAdmin(user) || user.id === job.creatorId || user.id === job.assigneeId);

export const canCompleteJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  job.status !== JobStatus.COMPLETED &&
  job.status !== JobStatus.CANCELLED &&
  (isAdmin(user) || user.id === job.creatorId || user.id === job.assigneeId);

export const canReopenJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) &&
  (isAdmin(user) || user.id === job.creatorId);

export const canCancelJob = (user: UserLike, job: JobLike) =>
  user.isActive &&
  job.status !== JobStatus.COMPLETED &&
  job.status !== JobStatus.CANCELLED &&
  (isAdmin(user) || user.id === job.creatorId);

export const canHideJob = (user: UserLike) => user.isActive && isAdmin(user);

export const canManageUsers = (user: UserLike) => user.isActive && isAdmin(user);

type ReminderLike = {
  status: ReminderStatus;
};

export const canCreateReminder = (user: UserLike) =>
  user.isActive && isAdmin(user);

export const canCompleteReminder = (user: UserLike, reminder: ReminderLike) =>
  user.isActive && reminder.status === ReminderStatus.OPEN;
