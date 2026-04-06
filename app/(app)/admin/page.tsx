import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { createReminderAction, toggleJobVisibilityAction, toggleUserActiveAction, toggleUserRoleAction } from "@/app/actions";
import { ReminderCard } from "@/components/reminder-card";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireCurrentUser();

  if (user.role !== Role.ADMIN) {
    redirect("/");
  }

  const [users, hiddenJobs, reminders] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    }),
    prisma.job.findMany({
      where: {
        hiddenAt: {
          not: null,
        },
      },
      orderBy: {
        hiddenAt: "desc",
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.reminder.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <p className="page-eyebrow">Hallinta</p>
          <CardTitle className="text-2xl">Käyttäjät</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {users.map((target) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 md:flex-row md:items-center md:justify-between"
              key={target.id}
            >
              <div>
                <p className="font-medium text-foreground">{target.name || target.email}</p>
                <p className="text-sm text-muted-foreground">{target.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{roleLabels[target.role]}</Badge>
                  <Badge variant={target.isActive ? "secondary" : "outline"}>
                    {target.isActive ? "Aktiivinen" : "Pois käytöstä"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {target.id !== user.id ? (
                  <>
                    <form action={toggleUserRoleAction}>
                      <input name="userId" type="hidden" value={target.id} />
                      <SubmitButton pendingLabel="Päivitetään..." variant="outline">
                        {target.role === "ADMIN" ? "Poista admin" : "Tee adminiksi"}
                      </SubmitButton>
                    </form>
                    <form action={toggleUserActiveAction}>
                      <input name="userId" type="hidden" value={target.id} />
                      <SubmitButton pendingLabel="Päivitetään..." variant="outline">
                        {target.isActive ? "Poista käytöstä" : "Aktivoi"}
                      </SubmitButton>
                    </form>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Oma käyttäjä</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <p className="page-eyebrow">Muistutukset</p>
            <CardTitle className="text-2xl">Luo muistutus</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <form action={createReminderAction} className="grid gap-4 rounded-2xl border border-border/70 bg-card/85 p-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Otsikko</FieldLabel>
                  <Input id="title" name="title" placeholder="Esim. Lähetä viikkoraportti" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Lisäkuvaus</FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Mitä pitää muistaa tehdä ja mitä siihen liittyy?"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="dueDate">Eräpäivä</FieldLabel>
                  <Input id="dueDate" name="dueDate" required type="date" />
                </Field>
              </FieldGroup>

              <div className="flex justify-end">
                <SubmitButton pendingLabel="Luodaan muistutus...">Tallenna muistutus</SubmitButton>
              </div>
            </form>

            <div className="grid gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Avoimet muistutukset</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nousevat dashboardin kärkeen kaikille käyttäjille, kunnes ne kuitataan tehdyiksi.
                </p>
              </div>

              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <ReminderCard compact key={reminder.id} redirectTo="/admin" reminder={reminder} />
                ))
              ) : (
                <p className="rounded-xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                  Avoimia muistutuksia ei ole juuri nyt.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="page-eyebrow">Näkyvyys</p>
            <CardTitle className="text-2xl">Piilotetut keikat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {hiddenJobs.length > 0 ? (
              hiddenJobs.map((job) => (
                <div className="rounded-xl border border-border/70 p-4" key={job.id}>
                  <p className="font-medium text-foreground">{job.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Piilotettu: {formatDateTime(job.hiddenAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Luoja: {job.creator.name || job.creator.email}
                  </p>
                  <form action={toggleJobVisibilityAction} className="mt-3">
                    <input name="jobId" type="hidden" value={job.id} />
                    <SubmitButton pendingLabel="Palautetaan..." variant="outline">
                      Palauta näkyviin
                    </SubmitButton>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Piilotettuja keikkoja ei ole.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
