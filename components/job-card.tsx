import type { JobStatus } from "@prisma/client";
import { CalendarDaysIcon, MapPinIcon, PaperclipIcon, PhoneIcon, UserIcon } from "lucide-react";

import { ActionLink } from "@/components/ui/action-link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJobDate, formatPerson, formatPhoneHref } from "@/lib/format";
import { appIcons } from "@/lib/app-icons";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";

import { JobStatusBadge } from "@/components/job-status-badge";

type JobCardProps = {
  job: {
    id: string;
    title: string;
    description: string;
    jobNumber: string | null;
    address: string;
    area: string | null;
    scheduledDate: Date;
    technicianPhones: string[];
    status: JobStatus;
    customerName: string;
    creator: { name: string | null; email: string };
    assignee: { name: string | null; email: string } | null;
    _count: { attachments: number; entries: number };
  };
};

export const JobCard = ({ job }: JobCardProps) => (
  <Card className="relative overflow-hidden border-border/80 bg-card/95">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
    <CardHeader className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="page-eyebrow">Työmaa</p>
          <CardTitle className="text-xl">
            <ActionLink
              className="text-xl font-medium text-foreground hover:text-primary"
              href={`/keikat/${job.id}`}
              icon={appIcons.open}
              tone="muted"
              variant="inline"
            >
              {job.title}
            </ActionLink>
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {job.description}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span>{job.customerName}</span>
            {job.jobNumber ? <span className="rounded-full border border-border/70 px-2 py-1 tracking-[0.16em]">Työnro {job.jobNumber}</span> : null}
          </div>
        </div>

        <JobStatusBadge status={job.status} />
      </div>
    </CardHeader>

    <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
      <div className="flex items-center gap-2">
        <CalendarDaysIcon className="size-4" />
        <span>{formatJobDate(job.scheduledDate)}</span>
      </div>
      <div className="flex items-center gap-2">
        <MapPinIcon className="size-4" />
        <span className="min-w-0">
          {job.address}
          {job.area ? `, ${job.area}` : ""}
        </span>
        <ActionLink
          className="ml-auto shrink-0"
          external
          href={buildGoogleMapsSearchUrl([job.address, job.area].filter(Boolean).join(", "))}
          icon={appIcons.maps}
          tone="primary"
        >
          Maps
        </ActionLink>
      </div>
      <div className="flex items-center gap-2">
        <UserIcon className="size-4" />
        <span>Vastuussa: {formatPerson(job.assignee)}</span>
      </div>
      <div className="flex items-start gap-2">
        <PhoneIcon className="size-4" />
        {job.technicianPhones.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {job.technicianPhones.map((phone) => (
              <ActionLink
                className="py-1"
                external
                href={`tel:${formatPhoneHref(phone)}`}
                icon={appIcons.phone}
                key={phone}
                tone="default"
              >
                {phone}
              </ActionLink>
            ))}
          </div>
        ) : (
          <span>Huoltomiehen numero puuttuu</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <PaperclipIcon className="size-4" />
        <span>
          {job._count.attachments} kuvaa · {job._count.entries} merkintää
        </span>
      </div>
    </CardContent>

    <CardFooter className="flex flex-col items-start gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Luonut: {formatPerson(job.creator)}</span>
      <ActionLink
        className="sm:self-auto"
        href={`/keikat/${job.id}`}
        icon={appIcons.open}
        tone="muted"
      >
        Avaa keikka
      </ActionLink>
    </CardFooter>
  </Card>
);
