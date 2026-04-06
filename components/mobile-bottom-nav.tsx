"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  ClipboardListIcon,
  FolderArchiveIcon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react";

import { useLiveNotifications } from "@/components/notification-live-provider";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Keikat",
    icon: ClipboardListIcon,
  },
  {
    href: "/omat",
    label: "Omat",
    icon: WrenchIcon,
  },
  {
    href: "/keikat/uusi",
    label: "Uusi",
    icon: PlusIcon,
  },
  {
    href: "/ilmoitukset",
    label: "Inbox",
    icon: BellIcon,
  },
  {
    href: "/arkisto",
    label: "Arkisto",
    icon: FolderArchiveIcon,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useLiveNotifications();

  return (
    <nav className="fixed inset-x-2.5 bottom-0 z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mobile-nav-surface grid grid-cols-5 rounded-[1.45rem] p-1.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isNotifications = item.href === "/ilmoitukset";
          const isCreate = item.href === "/keikat/uusi";

          return (
            <Link
              className={cn(
                "relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-white/60 transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  : "hover:bg-white/8 hover:text-white",
                isCreate && !isActive ? "text-white/90" : "",
              )}
              href={item.href}
              key={item.href}
            >
              <span className="relative inline-flex">
                <Icon className={cn("size-[1.15rem]", isCreate && "size-[1.3rem]")} />
                {isNotifications && unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 ring-2 ring-[#23282e]" />
                ) : null}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
