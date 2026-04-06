import { JobStatus } from "@prisma/client";
import { RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { jobStatusLabels } from "@/lib/constants";
import type { JobSearchFilters } from "@/lib/job-search";

type JobFilterFormProps = {
  filters: JobSearchFilters;
  allowArchived?: boolean;
};

export const JobFilterForm = ({
  filters,
  allowArchived = false,
}: JobFilterFormProps) => {
  const statuses = allowArchived
    ? [JobStatus.COMPLETED, JobStatus.CANCELLED]
    : [JobStatus.OPEN, JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CANCELLED];

  return (
    <form className="section-panel p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4 md:mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <SlidersHorizontalIcon className="size-3.5" />
            </span>
            <p className="page-eyebrow">Työmaan suodatus</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Rajaa keikat nopeasti alueen, tilan ja päivän perusteella.
          </p>
        </div>
      </div>

      <FieldGroup className="gap-3 rounded-[1.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(248,245,239,0.9)_100%)] p-3 md:p-4 xl:grid xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.95fr)_minmax(150px,0.7fr)_minmax(180px,0.8fr)_auto] xl:items-end">
        <Field className="xl:min-w-0">
          <FieldLabel className="text-[0.78rem] font-semibold tracking-[0.01em] text-muted-foreground" htmlFor="q">
            Haku
          </FieldLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              className="border-border/60 bg-white pl-10 shadow-[0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-muted-foreground/75"
              defaultValue={filters.q}
              enterKeyHint="search"
              id="q"
              name="q"
              placeholder="Otsikko, osoite tai kuvaus"
              type="search"
            />
          </div>
        </Field>
        <Field className="xl:min-w-0">
          <FieldLabel className="text-[0.78rem] font-semibold tracking-[0.01em] text-muted-foreground" htmlFor="area">
            Alue
          </FieldLabel>
          <Input
            className="border-border/60 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-muted-foreground/75"
            defaultValue={filters.area}
            id="area"
            name="area"
            placeholder="Esim. Kallio"
          />
        </Field>
        <Field className="xl:min-w-0">
          <FieldLabel className="text-[0.78rem] font-semibold tracking-[0.01em] text-muted-foreground" htmlFor="status">
            Tila
          </FieldLabel>
          <select
            className="h-11 w-full rounded-xl border border-border/60 bg-white px-3 text-base text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 md:rounded-lg md:px-2.5 md:text-sm"
            defaultValue={filters.status ?? ""}
            id="status"
            name="status"
          >
            <option value="">Kaikki</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {jobStatusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field className="xl:min-w-0">
          <FieldLabel className="text-[0.78rem] font-semibold tracking-[0.01em] text-muted-foreground" htmlFor="date">
            Päivä
          </FieldLabel>
          <Input
            className="border-border/60 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            defaultValue={filters.date}
            id="date"
            name="date"
            type="date"
          />
        </Field>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end xl:self-end xl:pt-0 xl:pl-1">
          <Button className="w-full sm:w-auto" type="submit">
            Suodata
          </Button>
          <Button className="w-full border-border/60 bg-white sm:w-auto" type="reset" variant="outline">
            <RotateCcwIcon data-icon="inline-start" />
            Tyhjennä kentät
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};
