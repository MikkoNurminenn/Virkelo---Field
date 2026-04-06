import { addDays } from "date-fns";
import { JobStatus, Prisma } from "@prisma/client";

import { activeJobStatuses, archivedJobStatuses } from "@/lib/constants";

export type JobSearchFilters = {
  q?: string;
  area?: string;
  status?: string;
  date?: string;
};

export const normalizeFilters = (
  params: Record<string, string | string[] | undefined>,
): JobSearchFilters => ({
  q: typeof params.q === "string" ? params.q : undefined,
  area: typeof params.area === "string" ? params.area : undefined,
  status: typeof params.status === "string" ? params.status : undefined,
  date: typeof params.date === "string" ? params.date : undefined,
});

const buildSearchWhere = (filters: JobSearchFilters): Prisma.JobWhereInput[] => {
  const where: Prisma.JobWhereInput[] = [];

  if (filters.q?.trim()) {
    where.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { address: { contains: filters.q, mode: "insensitive" } },
        { customerName: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.area?.trim()) {
    where.push({
      area: {
        contains: filters.area,
        mode: "insensitive",
      },
    });
  }

  if (filters.date) {
    const start = new Date(filters.date);

    if (!Number.isNaN(start.getTime())) {
      where.push({
        scheduledDate: {
          gte: start,
          lt: addDays(start, 1),
        },
      });
    }
  }

  return where;
};

const getStatusFilter = (
  filters: JobSearchFilters,
  fallback: JobStatus[],
): Prisma.JobWhereInput => {
  if (filters.status && Object.values(JobStatus).includes(filters.status as JobStatus)) {
    return {
      status: filters.status as JobStatus,
    };
  }

  return {
    status: {
      in: fallback,
    },
  };
};

const getVisibilityWhere = (userId: string, isAdmin: boolean): Prisma.JobWhereInput =>
  isAdmin
    ? {}
    : {
        OR: [
          { hiddenAt: null },
          { creatorId: userId },
          { assigneeId: userId },
        ],
      };

export const buildActiveJobsWhere = (
  filters: JobSearchFilters,
  userId: string,
  isAdmin: boolean,
): Prisma.JobWhereInput => ({
  AND: [getVisibilityWhere(userId, isAdmin), getStatusFilter(filters, activeJobStatuses), ...buildSearchWhere(filters)],
});

export const buildArchiveJobsWhere = (
  filters: JobSearchFilters,
  userId: string,
  isAdmin: boolean,
): Prisma.JobWhereInput => ({
  AND: [getVisibilityWhere(userId, isAdmin), getStatusFilter(filters, archivedJobStatuses), ...buildSearchWhere(filters)],
});

export const buildMyJobsWhere = (
  filters: JobSearchFilters,
  userId: string,
): Prisma.JobWhereInput => ({
  AND: [
    {
      OR: [{ creatorId: userId }, { assigneeId: userId }],
    },
    ...buildSearchWhere(filters),
  ],
});
