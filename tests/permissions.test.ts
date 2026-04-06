import { JobStatus, ReminderStatus, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  canCompleteJob,
  canCompleteReminder,
  canCreateReminder,
  canEditJob,
  canHideJob,
  canReleaseJob,
  canTakeJob,
  canViewJob,
} from "@/lib/permissions";

const user = {
  id: "user_1",
  role: Role.USER,
  isActive: true,
};

const admin = {
  id: "admin_1",
  role: Role.ADMIN,
  isActive: true,
};

const openJob = {
  creatorId: "creator_1",
  assigneeId: null,
  hiddenAt: null,
  status: JobStatus.OPEN,
};

const openReminder = {
  status: ReminderStatus.OPEN,
};

describe("permissions", () => {
  it("allows active users to view visible jobs", () => {
    expect(canViewJob(user, openJob)).toBe(true);
  });

  it("blocks hidden jobs for unrelated users", () => {
    expect(
      canViewJob(user, {
        ...openJob,
        hiddenAt: new Date(),
      }),
    ).toBe(false);
  });

  it("lets admins view hidden jobs", () => {
    expect(
      canViewJob(admin, {
        ...openJob,
        hiddenAt: new Date(),
      }),
    ).toBe(true);
  });

  it("allows only open and unassigned jobs to be claimed", () => {
    expect(canTakeJob(user, openJob)).toBe(true);
    expect(
      canTakeJob(user, {
        ...openJob,
        assigneeId: "someone",
      }),
    ).toBe(false);
    expect(
      canTakeJob(user, {
        ...openJob,
        status: JobStatus.IN_PROGRESS,
      }),
    ).toBe(false);
  });

  it("allows creator, assignee and admin to edit", () => {
    expect(
      canEditJob(
        {
          ...user,
          id: "creator_1",
        },
        openJob,
      ),
    ).toBe(true);
    expect(
      canEditJob(
        {
          ...user,
          id: "assignee_1",
        },
        {
          ...openJob,
          assigneeId: "assignee_1",
        },
      ),
    ).toBe(true);
    expect(canEditJob(admin, openJob)).toBe(true);
  });

  it("allows release and completion only for active participants", () => {
    const claimedJob = {
      ...openJob,
      assigneeId: "user_1",
      status: JobStatus.IN_PROGRESS,
    };

    expect(canReleaseJob(user, claimedJob)).toBe(true);
    expect(canCompleteJob(user, claimedJob)).toBe(true);
    expect(
      canCompleteJob(
        {
          ...user,
          isActive: false,
        },
        claimedJob,
      ),
    ).toBe(false);
  });

  it("limits visibility controls to admins", () => {
    expect(canHideJob(admin)).toBe(true);
    expect(canHideJob(user)).toBe(false);
  });

  it("allows only admins to create reminders", () => {
    expect(canCreateReminder(admin)).toBe(true);
    expect(canCreateReminder(user)).toBe(false);
  });

  it("allows active users to complete only open reminders", () => {
    expect(canCompleteReminder(user, openReminder)).toBe(true);
    expect(
      canCompleteReminder(user, {
        status: ReminderStatus.COMPLETED,
      }),
    ).toBe(false);
    expect(
      canCompleteReminder(
        {
          ...user,
          isActive: false,
        },
        openReminder,
      ),
    ).toBe(false);
  });
});
