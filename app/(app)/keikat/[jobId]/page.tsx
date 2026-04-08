import { format } from "date-fns";
import { JobAttachmentKind, JobEntryType, JobStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import {
  addJobAttachmentsAction,
  addJobNoteAction,
  addJobWorkLogAction,
  cancelJobAction,
  completeJobAction,
  releaseJobAction,
  reopenJobAction,
  takeJobAction,
  toggleJobVisibilityAction,
  updateJobAction,
} from "@/app/actions";
import { AddressFields } from "@/components/address-fields";
import { AttachmentGallery } from "@/components/attachment-gallery";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { JobEntryList } from "@/components/job-entry-list";
import { JobStatusBadge } from "@/components/job-status-badge";
import { PhoneListInput } from "@/components/phone-list-input";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActionLink } from "@/components/ui/action-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { attachmentKindLabels, jobStatusLabels } from "@/lib/constants";
import { appIcons } from "@/lib/app-icons";
import { formatDateTime, formatHours, formatJobDate, formatOptionalText, formatPerson, formatPhoneHref } from "@/lib/format";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { canCancelJob, canCompleteJob, canEditJob, canHideJob, canReleaseJob, canReopenJob, canTakeJob, canViewJob } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

const attachmentKinds = [
  JobAttachmentKind.REFERENCE,
  JobAttachmentKind.BEFORE,
  JobAttachmentKind.WORK,
  JobAttachmentKind.AFTER,
];

const getEntryMetadata = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireCurrentUser();
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
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
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      entries: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!job || !canViewJob(user, job)) {
    notFound();
  }

  const editable = canEditJob(user, job);
  const canTake = canTakeJob(user, job);
  const canRelease = canReleaseJob(user, job);
  const canComplete = canCompleteJob(user, job);
  const canReopen = canReopenJob(user, job);
  const canCancel = canCancelJob(user, job);
  const adminCanHide = canHideJob(user);
  const mapsUrl = buildGoogleMapsSearchUrl([job.address, job.area].filter(Boolean).join(", "));
  const defaultWorkLogDate = format(new Date(), "yyyy-MM-dd");
  const workLogEntries = job.entries.filter((entry) => entry.type === JobEntryType.WORK_LOG);
  const totalLoggedHours = workLogEntries.reduce((sum, entry) => {
    const metadata = getEntryMetadata(entry.metadata);
    return sum + (typeof metadata?.hours === "number" ? metadata.hours : 0);
  }, 0);
  const receiptCount = job.attachments.filter((attachment) => attachment.kind === JobAttachmentKind.RECEIPT).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:gap-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xl sm:text-2xl">{job.title}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  {job.description}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <JobStatusBadge status={job.status} />
                {job.hiddenAt ? <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">Piilotettu</span> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(45,92,136,0.08)_0%,rgba(255,255,255,0.82)_100%)] p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/75 bg-white/82 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Päivä
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatJobDate(job.scheduledDate)}</p>
                </div>
                <div className="rounded-2xl border border-white/75 bg-white/82 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Asiakas
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{job.customerName}</p>
                </div>
                <div className="rounded-2xl border border-white/75 bg-white/82 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Työnumero
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {job.jobNumber?.trim() ? job.jobNumber : "Ei asetettu"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/75 bg-white/82 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Kirjatut tunnit
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{formatHours(totalLoggedHours)}</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-[1.35rem] bg-background/72 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Osoite</p>
                  <p className="mt-1 text-sm text-foreground">
                    {job.address}
                    {job.area ? `, ${job.area}` : ""}
                  </p>
                  <ActionLink
                    className="mt-2"
                    external
                    href={mapsUrl}
                    icon={appIcons.maps}
                    tone="primary"
                    variant="inline"
                  >
                    Avaa Google Mapsissa
                  </ActionLink>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Luotu</p>
                  <p className="mt-1 text-sm text-foreground">{formatDateTime(job.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Luoja</p>
                  <p className="mt-1 text-sm text-foreground">{formatPerson(job.creator)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vastuuhenkilö</p>
                  <p className="mt-1 text-sm text-foreground">{formatPerson(job.assignee)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Työpäiväkirjaukset</p>
                  <p className="mt-1 text-sm text-foreground">{workLogEntries.length} päivää kirjattu</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kuittikuvat</p>
                  <p className="mt-1 text-sm text-foreground">
                    {receiptCount > 0 ? `${receiptCount} tallennettu` : "Ei kuitteja"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Huoltomiehen numerot</p>
                  {job.technicianPhones.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
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
                    <p className="mt-1 text-sm text-muted-foreground">Numeroita ei ole vielä lisätty.</p>
                  )}
                </div>
              </div>
            </div>

            <Alert>
              <AlertTitle>Lisätiedot</AlertTitle>
              <AlertDescription>{formatOptionalText(job.notes)}</AlertDescription>
            </Alert>

            {editable ? (
              <form action={updateJobAction} className="grid gap-5 rounded-[1.6rem] border border-border/70 bg-card/92 p-5">
                <input name="jobId" type="hidden" value={job.id} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Muokkaa perustietoja</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vain luoja, vastuuhenkilö ja admin voivat päivittää perustietoja.
                  </p>
                </div>

                <FieldGroup className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
                  <Field>
                    <FieldLabel htmlFor="title">Otsikko</FieldLabel>
                    <Input defaultValue={job.title} id="title" name="title" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="jobNumber">Työnumero</FieldLabel>
                    <Input defaultValue={job.jobNumber ?? ""} id="jobNumber" name="jobNumber" />
                    <FieldDescription>Voit jättää tyhjäksi, jos työnumeroa ei ole.</FieldDescription>
                  </Field>
                  <Field className="lg:col-span-2">
                    <FieldLabel htmlFor="description">Kuvaus</FieldLabel>
                    <Textarea defaultValue={job.description} id="description" name="description" />
                  </Field>
                </FieldGroup>

                <FieldGroup className="lg:grid lg:grid-cols-2">
                  <AddressFields addressDefaultValue={job.address} areaDefaultValue={job.area ?? ""} />
                  <Field>
                    <FieldLabel htmlFor="scheduledDate">Päivä</FieldLabel>
                    <Input
                      defaultValue={job.scheduledDate.toISOString().slice(0, 10)}
                      id="scheduledDate"
                      name="scheduledDate"
                      required
                      type="date"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="customerName">Asiakas</FieldLabel>
                    <Input defaultValue={job.customerName} id="customerName" name="customerName" />
                  </Field>
                </FieldGroup>

                <PhoneListInput
                  description="Lisää yksi tai useampi huoltomiehen numero. Tyhjät rivit ohitetaan tallennuksessa."
                  label="Huoltomiehen numerot"
                  name="technicianPhones"
                  values={job.technicianPhones}
                />

                <Field>
                  <FieldLabel htmlFor="notes">Lisätiedot</FieldLabel>
                  <Textarea defaultValue={job.notes ?? ""} id="notes" name="notes" />
                </Field>

                <div className="flex justify-end">
                  <SubmitButton pendingLabel="Tallennetaan...">Päivitä tiedot</SubmitButton>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>

        {job.attachments.length > 0 ? (
          <AttachmentGallery attachments={job.attachments} />
        ) : (
          <Empty className="section-panel">
            <EmptyHeader>
              <EmptyTitle>Kuvaliitteitä ei ole vielä lisätty</EmptyTitle>
              <EmptyDescription>
                Lisää työkuvia, kuittikuvia tai ennen/jälkeen-kuvia detail-sivun oikeasta laidasta.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {job.entries.length > 0 ? (
          <JobEntryList entries={job.entries} />
        ) : (
          <Empty className="section-panel">
            <EmptyHeader>
              <EmptyTitle>Aikajana on vielä tyhjä</EmptyTitle>
              <EmptyDescription>
                Ensimmäinen työpäiväkirjaus, muistiinpano tai valmistumisraportti ilmestyy tänne.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <aside className="grid gap-6 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Toiminnot</CardTitle>
            <CardDescription>
              Tilapäivitykset ja näkyvyyden hallinta keikan nykyisen tilan perusteella.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:flex sm:flex-wrap">
            {canTake ? (
              <form action={takeJobAction} className="w-full sm:w-auto">
                <input name="jobId" type="hidden" value={job.id} />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Otetaan...">Ota työn alle</SubmitButton>
              </form>
            ) : null}
            {canRelease ? (
              <form action={releaseJobAction} className="w-full sm:w-auto">
                <input name="jobId" type="hidden" value={job.id} />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Palautetaan..." variant="outline">
                  Palauta avoimeksi
                </SubmitButton>
              </form>
            ) : null}
            {canReopen ? (
              <form action={reopenJobAction} className="w-full sm:w-auto">
                <input name="jobId" type="hidden" value={job.id} />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Avataan..." variant="outline">
                  Avaa uudelleen
                </SubmitButton>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelJobAction} className="w-full sm:w-auto">
                <input name="jobId" type="hidden" value={job.id} />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Perutaan..." variant="outline">
                  Peru keikka
                </SubmitButton>
              </form>
            ) : null}
            {adminCanHide ? (
              <form action={toggleJobVisibilityAction} className="w-full sm:w-auto">
                <input name="jobId" type="hidden" value={job.id} />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Päivitetään..." variant="outline">
                  {job.hiddenAt ? "Palauta näkyviin" : "Piilota keikka"}
                </SubmitButton>
              </form>
            ) : null}
          </CardContent>
        </Card>

        {editable ? (
          <Card className="border-primary/20 bg-[linear-gradient(180deg,rgba(45,92,136,0.10)_0%,rgba(255,255,255,0.96)_100%)]">
            <CardHeader>
              <CardTitle>Kirjaa työpäivä</CardTitle>
              <CardDescription>
                Lisää tunnit, tavarat ja mahdollinen kuittikuva juuri sille päivälle jolloin työtä
                tehtiin. Samalle keikalle voi kirjata useita päiviä.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addJobWorkLogAction} className="grid gap-5">
                <input name="jobId" type="hidden" value={job.id} />
                <FieldGroup className="sm:grid sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="workDate">Työpäivä</FieldLabel>
                    <Input defaultValue={defaultWorkLogDate} id="workDate" name="workDate" required type="date" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="hours">Tunnit</FieldLabel>
                    <Input id="hours" inputMode="decimal" name="hours" placeholder="Esim. 7,5" />
                    <FieldDescription>
                      Valinnainen. Voit kirjata tunnit myös myöhemmin toiselle päivälle.
                    </FieldDescription>
                  </Field>
                </FieldGroup>

                {job.jobNumber ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground">
                    Keikan työnumero: <span className="font-medium text-foreground">{job.jobNumber}</span>
                  </div>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="materials">Tavaralista</FieldLabel>
                  <Textarea
                    id="materials"
                    name="materials"
                    placeholder="Listaa käytetyt osat tai tarvikkeet, yksi per rivi tai pilkuilla eroteltuna."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="note">Huomio</FieldLabel>
                  <Textarea
                    id="note"
                    name="note"
                    placeholder="Mitä tehtiin tänään, mitä jäi seuraavalle päivälle tai mitä pitää tietää jatkossa?"
                  />
                </Field>

                <AttachmentUploader
                  description="Tähän voi lisätä kuvan kuitista, esimerkiksi Ahlsellilta tai Dahlilta."
                  label="Kuittikuvat"
                  name="receiptAttachments"
                />

                <SubmitButton className="w-full sm:w-auto" pendingLabel="Tallennetaan...">
                  Tallenna työpäivä
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {editable ? (
          <Card>
            <CardHeader>
              <CardTitle>Lisää muistiinpano</CardTitle>
              <CardDescription>
                Käytä tätä, kun haluat vain nopean tekstimerkinnän ilman tunti- tai tavarakirjausta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addJobNoteAction} className="grid gap-4">
                <input name="jobId" type="hidden" value={job.id} />
                <Field>
                  <FieldLabel htmlFor="message">Muistiinpano</FieldLabel>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Kirjaa mitä havaittiin, mitä pitää vielä tehdä tai muuta tärkeää tietoa."
                    required
                  />
                </Field>
                <SubmitButton pendingLabel="Tallennetaan..." variant="outline">
                  Tallenna muistiinpano
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {editable ? (
          <Card>
            <CardHeader>
              <CardTitle>Lisää kuvia</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addJobAttachmentsAction} className="grid gap-5">
                <input name="jobId" type="hidden" value={job.id} />
                <Field>
                  <FieldLabel htmlFor="kind">Kuvatyyppi</FieldLabel>
                  <select
                    className="h-11 rounded-xl border border-input bg-background/85 px-3 text-base text-foreground md:h-8 md:rounded-lg md:px-2.5 md:text-sm"
                    defaultValue={JobAttachmentKind.WORK}
                    id="kind"
                    name="kind"
                  >
                    {attachmentKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {attachmentKindLabels[kind]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="caption">Kuvateksti</FieldLabel>
                  <Input id="caption" name="caption" placeholder="Esim. Vanha venttiili ennen vaihtoa" />
                </Field>
                <AttachmentUploader
                  description="Voit lisätä useita kuvia kerralla. Jokainen kuva näkyy suojatun proxy-reitin kautta."
                  label="Kuvat"
                  name="jobAttachments"
                />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Tallennetaan..." variant="outline">
                  Lisää kuvat
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {canComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Merkitse valmiiksi</CardTitle>
              <CardDescription>
                Tallenna työraportti, tehdyt muutokset ja loppukuvat yhdellä kertaa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={completeJobAction} className="grid gap-5">
                <input name="jobId" type="hidden" value={job.id} />
                <Field>
                  <FieldLabel htmlFor="workSummary">Mitä tehtiin / mitä vaihdettiin</FieldLabel>
                  <Textarea
                    id="workSummary"
                    name="workSummary"
                    placeholder="Kirjaa toteutetut vaihdot, huolto tai muutokset mahdollisimman konkreettisesti."
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="additionalNotes">Lisähuomiot</FieldLabel>
                  <Textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    placeholder="Mahdolliset jatkotoimet, poikkeamat tai huomautukset"
                  />
                </Field>
                <AttachmentUploader
                  description="Loppukuvat tallennetaan automaattisesti Jälkeen-kategoriaan."
                  label="Loppukuvat"
                  name="completionAttachments"
                />
                <SubmitButton className="w-full sm:w-auto" pendingLabel="Päivitetään..." variant="default">
                  Merkitse keikka valmiiksi
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Keikan tila</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Nykyinen tila: {jobStatusLabels[job.status]}</p>
            {job.completedAt ? <p className="mt-2">Valmistunut: {formatDateTime(job.completedAt)}</p> : null}
            {job.status === JobStatus.IN_PROGRESS && job.assignee ? (
              <p className="mt-2">Työn alla: {formatPerson(job.assignee)}</p>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
