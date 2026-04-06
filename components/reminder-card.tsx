import { completeReminderAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { appIcons } from "@/lib/app-icons";
import { formatJobDate, formatPerson, getReminderDueLabel, getReminderDueTone } from "@/lib/format";

type ReminderCardProps = {
  reminder: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    createdBy: {
      name: string | null;
      email: string;
    };
  };
  redirectTo?: string;
  compact?: boolean;
};

export function ReminderCard({
  reminder,
  redirectTo = "/",
  compact = false,
}: ReminderCardProps) {
  const ReminderIcon = appIcons.reminder;
  const DueIcon = appIcons.due;
  const dueLabel = getReminderDueLabel(reminder.dueDate);
  const dueTone = getReminderDueTone(reminder.dueDate);

  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,245,239,0.92)_100%)] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ReminderIcon className="size-4" />
            </span>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
                Avoin muistutus
              </p>
              <h3 className="mt-1 text-lg font-semibold leading-tight text-foreground">
                {reminder.title}
              </h3>
            </div>
          </div>

          {reminder.description?.trim() ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {reminder.description}
            </p>
          ) : null}
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${dueTone}`}>
          <DueIcon className="size-4" />
          {dueLabel}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <p>Eräpäivä: {formatJobDate(reminder.dueDate)}</p>
          <p className="mt-1">Lisätty: {formatPerson(reminder.createdBy)}</p>
        </div>

        <form action={completeReminderAction} className="sm:self-end">
          <input name="reminderId" type="hidden" value={reminder.id} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <SubmitButton
            className={compact ? "w-full sm:w-auto" : "w-full sm:w-auto"}
            pendingLabel="Kuittaus tallennetaan..."
            size={compact ? "sm" : "default"}
          >
            Kuittaa tehdyksi
          </SubmitButton>
        </form>
      </div>
    </article>
  );
}
