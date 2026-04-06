import { Role } from "@prisma/client";

import { JobCard } from "@/components/job-card";
import { JobFilterForm } from "@/components/job-filter-form";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { buildArchiveJobsWhere, normalizeFilters } from "@/lib/job-search";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCurrentUser();
  const filters = normalizeFilters(await searchParams);

  const jobs = await prisma.job.findMany({
    where: buildArchiveJobsWhere(filters, user.id, user.role === Role.ADMIN),
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
      assignee: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          attachments: true,
          entries: true,
        },
      },
    },
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="page-eyebrow">Valmiit kohteet</p>
        <h2 className="page-title mt-2 !text-white">Arkisto</h2>
        <p className="mt-2 text-sm !text-white/72">
          Valmiit ja perutut keikat löytyvät arkistosta suodattimien avulla.
        </p>
      </div>

      <JobFilterForm allowArchived filters={filters} />

      <section className="grid gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => <JobCard job={job} key={job.id} />)
        ) : (
          <Empty className="section-panel">
            <EmptyHeader>
              <EmptyTitle>Arkistossa ei ole vielä keikkoja</EmptyTitle>
              <EmptyDescription>
                Valmiit keikat ja peruutukset alkavat näkyä täällä myöhemmin.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
