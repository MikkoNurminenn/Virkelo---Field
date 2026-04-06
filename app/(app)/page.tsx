import { Role } from "@prisma/client";

import { JobCard } from "@/components/job-card";
import { JobFilterForm } from "@/components/job-filter-form";
import { ReminderCard } from "@/components/reminder-card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { appIcons } from "@/lib/app-icons";
import { buildActiveJobsWhere, normalizeFilters } from "@/lib/job-search";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCurrentUser();
  const filters = normalizeFilters(await searchParams);

  const [reminders, jobs, stats] = await Promise.all([
    prisma.reminder.findMany({
      where: {
        status: "OPEN",
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.job.findMany({
      where: buildActiveJobsWhere(filters, user.id, user.role === Role.ADMIN),
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
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.job.groupBy({
      by: ["status"],
      where: buildActiveJobsWhere({}, user.id, user.role === Role.ADMIN),
      _count: {
        _all: true,
      },
    }),
  ]);

  const statMap = new Map(stats.map((entry) => [entry.status, entry._count._all]));
  const ReminderIcon = appIcons.reminder;
  const overviewStats = [
    {
      label: "Avoimet",
      value: statMap.get("OPEN") ?? 0,
      tone: "bg-[linear-gradient(180deg,#f7f4ee_0%,#efe7db_100%)] text-stone-900 border-stone-200",
      helper: "Valmiina työn alle",
    },
    {
      label: "Työn alla",
      value: statMap.get("IN_PROGRESS") ?? 0,
      tone: "bg-[linear-gradient(180deg,#f2f4f7_0%,#e7edf4_100%)] text-slate-900 border-slate-200",
      helper: "Aktiiviset kohteet",
    },
    {
      label: "Näytettävät keikat",
      value: jobs.length,
      tone: "bg-[linear-gradient(180deg,#fff4df_0%,#ffe6bf_100%)] text-stone-900 border-amber-200",
      helper: "Suodattimien mukaan",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {reminders.length > 0 ? (
        <section className="section-panel p-5 md:p-6" id="muistutukset">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <ReminderIcon className="size-4.5" />
                </span>
                <div>
                  <p className="page-eyebrow">Avoimet muistutukset</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
                    Nosta nämä alta pois ensin
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Muistutukset ovat keikoista erillisiä tehtäviä. Kun kuittaat ne tehdyksi,
                siitä lähtee ilmoitus kaikille aktiivisille käyttäjille.
              </p>
            </div>

            <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              {reminders.length} avointa muistutusta
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-panel overflow-hidden p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-start">
          <div className="space-y-3">
            <p className="page-eyebrow">Päivän työtilanne</p>
            <h2 className="max-w-3xl text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[2.35rem] md:text-[2.85rem]">
              Kentän tilanne yhdellä silmäyksellä
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Näe avoimet, työn alla olevat ja näkyvät kohteet heti. Suodatus ja keikkalistat ovat
              alla ilman erillisiä välivaiheita.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/74 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Näkymän tila
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="font-heading text-5xl leading-none text-foreground">{jobs.length}</p>
                <p className="mt-2 max-w-[12rem] text-sm leading-6 text-muted-foreground">
                  Keikkaa nykyisillä suodattimilla
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 px-3 py-2.5 text-right">
                <p className="text-xs font-semibold text-primary">Tuore näkymä</p>
                <p className="mt-1 text-sm leading-5 text-foreground">
                  Päivittyy heti muutoksista
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {overviewStats.map((stat) => (
            <div
              className={`rounded-[1.4rem] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${stat.tone}`}
              key={stat.label}
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-current/55">
                {stat.label}
              </p>
              <p className="mt-3 font-heading text-[3rem] leading-none text-current">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-current/72">{stat.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <JobFilterForm filters={filters} />

      <section className="grid gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => <JobCard job={job} key={job.id} />)
        ) : (
          <Empty className="section-panel">
            <EmptyHeader>
              <EmptyMedia variant="icon">0</EmptyMedia>
              <EmptyTitle>Ei osumia nykyisillä suodattimilla</EmptyTitle>
              <EmptyDescription>
                Kokeile laajempaa hakua tai lisää uusi keikka järjestelmään.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
