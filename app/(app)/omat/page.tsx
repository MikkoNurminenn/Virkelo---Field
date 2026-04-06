import { JobCard } from "@/components/job-card";
import { JobFilterForm } from "@/components/job-filter-form";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { buildMyJobsWhere, normalizeFilters } from "@/lib/job-search";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export default async function MyJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCurrentUser();
  const filters = normalizeFilters(await searchParams);

  const jobs = await prisma.job.findMany({
    where: buildMyJobsWhere(filters, user.id),
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
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="page-eyebrow">Oma vastuualue</p>
        <h2 className="page-title mt-2 !text-white">Omat keikat</h2>
        <p className="mt-2 text-sm !text-white/72">
          Täällä näkyvät keikat, jotka olet luonut tai ottanut työn alle.
        </p>
      </div>

      <JobFilterForm filters={filters} />

      <section className="grid gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => <JobCard job={job} key={job.id} />)
        ) : (
          <Empty className="section-panel">
            <EmptyHeader>
              <EmptyTitle>Sinulla ei ole vielä omia keikkoja</EmptyTitle>
              <EmptyDescription>
                Luo uusi keikka tai ota aktiivinen keikka työn alle.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
