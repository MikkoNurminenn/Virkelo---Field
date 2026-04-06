import { JobEntryType } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobEntryTypeLabels } from "@/lib/constants";
import { formatDateTime, formatPerson } from "@/lib/format";

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

export const JobEntryList = ({ entries }: JobEntryListProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Aikajana</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {entries.map((entry) => {
        const metadata =
          entry.metadata && typeof entry.metadata === "object"
            ? (entry.metadata as Record<string, unknown>)
            : null;

        return (
          <article
            className="rounded-xl border border-border/70 bg-muted/25 p-4"
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

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {entry.message}
            </p>

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
