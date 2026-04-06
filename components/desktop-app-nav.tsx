"use client";

import Link from "next/link";
import {
  BellIcon,
  ClipboardListIcon,
  FolderArchiveIcon,
  PlusIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { useLiveNotifications } from "@/components/notification-live-provider";

const darkActionClass =
  "on-dark-foreground !border-white/10 !bg-white/5 hover:!border-primary/40 hover:!bg-white/10";

const navLinkClass =
  `inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${darkActionClass}`;

function NotificationBell({
  className,
  hasUnread,
}: {
  className?: string;
  hasUnread: boolean;
}) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      <BellIcon className="inline size-4" />
      {hasUnread ? (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 ring-2 ring-[#22272d]" />
      ) : null}
    </span>
  );
}

export function DesktopAppNav({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const { unreadCount } = useLiveNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
      <Link className={navLinkClass} href="/">
        <ClipboardListIcon className="mr-2 inline size-4" />
        Aktiiviset keikat
      </Link>
      <Link className={navLinkClass} href="/omat">
        <WrenchIcon className="mr-2 inline size-4" />
        Omat keikat
      </Link>
      <Link className={navLinkClass} href="/arkisto">
        <FolderArchiveIcon className="mr-2 inline size-4" />
        Arkisto
      </Link>
      <Link className={navLinkClass} href="/ilmoitukset">
        <NotificationBell className="mr-2" hasUnread={hasUnread} />
        Ilmoitukset
      </Link>
      <Link
        className="inline-flex items-center rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        href="/keikat/uusi"
      >
        <PlusIcon className="mr-2 inline size-4" />
        Uusi keikka
      </Link>
      {isAdmin ? (
        <Link className={navLinkClass} href="/admin">
          <ShieldCheckIcon className="mr-2 inline size-4" />
          Admin
        </Link>
      ) : null}
      <SignOutButton className={darkActionClass} />
    </div>
  );
}
