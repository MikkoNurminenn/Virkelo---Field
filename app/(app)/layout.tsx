import Link from "next/link";
import { ShieldCheckIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { DesktopAppNav } from "@/components/desktop-app-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationLiveProvider } from "@/components/notification-live-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { brand } from "@/lib/brand";
import { buildLiveNotificationPreview } from "@/lib/notification-preview";
import { roleLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

const mobileActionClass =
  "on-dark-foreground inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/6 px-3.5 py-2 text-[0.8rem] font-medium transition hover:border-primary/40 hover:bg-white/10";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const [unreadNotifications, latestUnreadNotification] = await Promise.all([
    prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    }),
    prisma.notification.findFirst({
      where: {
        userId: user.id,
        readAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <NotificationLiveProvider
      key={`${unreadNotifications}:${latestUnreadNotification?.id ?? "none"}`}
      latestNotification={
        latestUnreadNotification ? buildLiveNotificationPreview(latestUnreadNotification) : null
      }
      unreadCount={unreadNotifications}
    >
      <div className="relative isolate min-h-dvh">
        <div className="app-shell-backdrop" />
        <div className="mobile-safe-shell mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 px-3 sm:gap-5 sm:px-4 lg:gap-7 lg:px-6">
          <header className="app-dark-surface dark-surface relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#1d2126]/96 p-4 text-white sm:rounded-[2rem] sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06)_0%,transparent_28%),linear-gradient(180deg,rgba(19,22,26,0.96)_0%,rgba(35,39,45,0.97)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_34%,rgba(0,0,0,0.08)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="pointer-events-none absolute top-0 right-0 h-28 w-28 translate-x-5 -translate-y-6 rotate-12 rounded-[1.75rem] border border-white/10 bg-white/5 opacity-55 sm:h-36 sm:w-36 sm:translate-x-8 sm:-translate-y-8 sm:rounded-[2rem] sm:opacity-70" />
            <div className="relative z-10 sm:hidden">
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <BrandMark
                      className="mt-0.5 h-11 w-11 shrink-0 drop-shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
                      size={44}
                    />
                    <div className="min-w-0 space-y-2.5">
                      <p className="page-eyebrow">{brand.eyebrow}</p>
                      <h1 className="max-w-[12ch] font-heading text-[1.12rem] leading-[1.08] uppercase tracking-[0.04em] text-white">
                        Kenttäkeskus
                      </h1>
                      <p className="max-w-[24ch] text-[0.82rem] leading-[1.55] text-white/70">
                        Keikat, muistutukset ja kuvat yhdestä mobiilinäkymästä.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
                    Live
                  </div>
                </div>

                <div className="on-dark-muted inline-flex max-w-full rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.78rem]">
                  {user.name || user.email} · {roleLabels[user.role]}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {user.role === "ADMIN" ? (
                    <Link className={mobileActionClass} href="/admin">
                      <ShieldCheckIcon className="mr-2 inline size-4" />
                      Admin
                    </Link>
                  ) : (
                    <Link className={mobileActionClass} href="/">
                      Kenttätila
                    </Link>
                  )}
                  <SignOutButton className={mobileActionClass} size="xs" />
                </div>
              </div>
            </div>

            <div className="relative z-10 hidden flex-col gap-4 sm:flex lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-3xl items-start gap-4">
                <BrandMark
                  className="mt-1 h-14 w-14 shrink-0 drop-shadow-[0_18px_36px_rgba(0,0,0,0.2)]"
                  size={56}
                />
                <div className="max-w-xl space-y-2">
                  <p className="page-eyebrow">{brand.eyebrow}</p>
                  <h1 className="max-w-3xl font-heading text-[2.45rem] leading-[0.94] tracking-[0.01em] text-white">
                    Keikat, työmaakuvat ja raportointi yhdestä komentokeskuksesta
                  </h1>
                  <div className="on-dark-muted inline-flex max-w-full rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                    Kirjautuneena: {user.name || user.email} · {roleLabels[user.role]}
                  </div>
                </div>
              </div>

              <DesktopAppNav isAdmin={user.role === "ADMIN"} />

              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                {user.role === "ADMIN" ? (
                  <Link className={mobileActionClass} href="/admin">
                    <ShieldCheckIcon className="mr-2 inline size-4" />
                    Admin
                  </Link>
                ) : null}
                <SignOutButton className={mobileActionClass} size="xs" />
              </div>
            </div>
          </header>

          <main className="flex-1 animate-in fade-in-0 slide-in-from-bottom-1 duration-500">{children}</main>
        </div>
        <MobileBottomNav />
      </div>
    </NotificationLiveProvider>
  );
}
