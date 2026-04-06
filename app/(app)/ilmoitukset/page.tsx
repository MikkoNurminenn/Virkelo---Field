import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { ActionLink } from "@/components/ui/action-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { appIcons } from "@/lib/app-icons";
import { notificationLabels } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export default async function NotificationsPage() {
  const ReadIcon = appIcons.read;
  const user = await requireCurrentUser();
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="page-eyebrow">Kenttäinbox</p>
          <h2 className="page-title mt-2 !text-white">Ilmoitukset</h2>
          <p className="mt-2 text-sm !text-white/72">
            Tärkeimmät keikkapäivitykset, muistutukset ja admin-muutokset yhdestä inboxista.
          </p>
        </div>

        <form action={markAllNotificationsReadAction}>
          <Button type="submit" variant="outline">
            <ReadIcon data-icon="inline-start" />
            Merkitse kaikki luetuiksi
          </Button>
        </form>
      </div>

      {notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notification) => {
            const payload =
              notification.payload && typeof notification.payload === "object"
                ? (notification.payload as {
                    title?: string;
                    body?: string;
                    href?: string;
                    actionLabel?: string;
                  })
                : null;

            return (
              <Card
                className={
                  notification.readAt
                    ? "bg-card/85"
                    : "border-primary/40 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_10%,white)_0%,var(--card)_100%)]"
                }
                key={notification.id}
              >
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">
                    {payload?.title ?? notificationLabels[notification.type]}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm leading-6 text-foreground">
                    {payload?.body ?? notificationLabels[notification.type]}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {notification.job ? (
                      <ActionLink
                        href={`/keikat/${notification.job.id}`}
                        icon={appIcons.open}
                        tone="primary"
                      >
                        Avaa keikka
                      </ActionLink>
                    ) : payload?.href ? (
                      <ActionLink href={payload.href} icon={appIcons.open} tone="primary">
                        {payload.actionLabel ?? "Avaa"}
                      </ActionLink>
                    ) : null}
                    {!notification.readAt ? (
                      <form action={markNotificationReadAction}>
                        <input name="notificationId" type="hidden" value={notification.id} />
                        <SubmitButton pendingLabel="Päivitetään..." variant="outline">
                          <ReadIcon data-icon="inline-start" />
                          Merkitse luetuksi
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty className="section-panel">
          <EmptyHeader>
            <EmptyTitle>Inbox on tyhjä</EmptyTitle>
            <EmptyDescription>Uudet tapahtumat ilmestyvät tänne automaattisesti.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
