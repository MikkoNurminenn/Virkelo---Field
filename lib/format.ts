import { differenceInCalendarDays, format } from "date-fns";
import { fi } from "date-fns/locale";

const fiLocale = { locale: fi };

export const formatJobDate = (date?: Date | null) =>
  date ? format(date, "d.M.yyyy", fiLocale) : "Ei asetettu";

export const formatDateTime = (date?: Date | null) =>
  date ? format(date, "d.M.yyyy HH:mm", fiLocale) : "Ei asetettu";

export const formatOptionalText = (value?: string | null) =>
  value?.trim() ? value : "Ei annettu";

export const formatHours = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Ei kirjattu";
  }

  return `${new Intl.NumberFormat("fi-FI", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value)} h`;
};

export const formatPerson = (value?: { name: string | null; email: string } | null) =>
  value?.name?.trim() || value?.email || "Ei määritelty";

export const formatPhoneHref = (value: string) => {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
};

export const getReminderDueLabel = (date: Date) => {
  const dayDifference = differenceInCalendarDays(date, new Date());

  if (dayDifference < 0) {
    return "Myöhässä";
  }

  if (dayDifference === 0) {
    return "Tänään";
  }

  if (dayDifference === 1) {
    return "Huomenna";
  }

  return `Erääntyy ${formatJobDate(date)}`;
};

export const getReminderDueTone = (date: Date) => {
  const dayDifference = differenceInCalendarDays(date, new Date());

  if (dayDifference < 0) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (dayDifference === 0) {
    return "border-primary/25 bg-primary/12 text-primary";
  }

  return "border-border/70 bg-background/80 text-muted-foreground";
};
