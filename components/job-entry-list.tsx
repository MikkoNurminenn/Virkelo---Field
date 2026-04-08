import { JobEntryType } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobEntryTypeLabels } from "@/lib/constants";
import { formatDateTime, formatHours, formatJobDate, formatPerson } from "@/lib/format";

type JobEntryListProps = {
  entries: Array<{
    id: string;
    type: JobEntryType;
    message: string;
    metadata: unknown;
    createdAt: Date;
    author: { name: string | null; email: string };
  }>;
};

const DEFAULT_WORK_LOG_MESSAGE = "Työpäivä kirjattiin.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const JobEntryList = ({ entries }: JobEntryListProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Aikajana</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {entries.map((entry) => {
        const metadata = isRecord(entry.metadata) ? entry.metadata : null;
        const parsedWorkDate =
          typeof metadata?.workDate === "string" ? new Date(metadata.workDate) : null;
        const workDate =
          parsedWorkDate && !Number.isNaN(parsedWorkDate.getTime()) ? parsedWorkDate : null;
        const workHours =
          typeof metadata?.hours === "number" ? metadata.hours : null;
        const materials =
          typeof metadata?.materials === "string" && metadata.materials.trim()
            ? metadata.materials
            : null;
        const workNote =
          typeof metadata?.note === "string" && metadata.note.trim()
            ? metadata.note
            : entry.message !== DEFAULT_WORK_LOG_MESSAGE
              ? entry.message
              : null;
        const receiptCount =
          typeof metadata?.receiptCount === "number"
            ? metadata.receiptCount
            : 0;
        const isWorkLog = entry.type === JobEntryType.WORK_LOG;

        return (
          <article
            className={`rounded-xl border p-4 ${
              isWorkLog
                ? "border-primary/20 bg-[linear-gradient(180deg,rgba(45,92,136,0.08)_0%,rgba(255,255,255,0.86)_100%)]"
                : "border-border/70 bg-muted/25"
            }`}
            key={entry.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">
                {jobEntryTypeLabels[entry.type]}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt)}
              </div>
            </div>

            {isWorkLog ? (
              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Työpäivä
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {workDate ? formatJobDate(workDate) : "Ei asetettu"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Tunnit
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatHours(workHours)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Kuitit
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {receiptCount > 0 ? `${receiptCount} kuvaa` : "Ei liitteitä"}
                    </p>
                  </div>
                </div>

                {materials ? (
                  <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Tavaralista
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {materials}
                    </p>
                  </div>
                ) : null}

                {workNote ? (
                  <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Huomio
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {workNote}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {entry.message}
              </p>
            )}

            {metadata?.additionalNotes && typeof metadata.additionalNotes === "string" ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Lisätiedot: {metadata.additionalNotes}
              </p>
            ) : null}

            <p className="mt-3 text-xs text-muted-foreground">
              Kirjaaja: {formatPerson(entry.author)}
            </p>
          </article>
        );
      })}
    </CardContent>
  </Card>
);
