import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellRingIcon,
  CalendarRangeIcon,
  CheckCheckIcon,
  MapPinnedIcon,
  PencilLineIcon,
  PhoneCallIcon,
} from "lucide-react";

export const appIcons = {
  open: ArrowRightIcon,
  external: ArrowUpRightIcon,
  reminder: BellRingIcon,
  due: CalendarRangeIcon,
  maps: MapPinnedIcon,
  phone: PhoneCallIcon,
  read: CheckCheckIcon,
  edit: PencilLineIcon,
} as const;

export type AppIcon = (typeof appIcons)[keyof typeof appIcons];
