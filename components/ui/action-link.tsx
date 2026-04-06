import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ActionLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  variant?: "inline" | "chip";
  tone?: "default" | "primary" | "muted";
  external?: boolean;
};

const variantClasses: Record<NonNullable<ActionLinkProps["variant"]>, string> = {
  inline:
    "inline-flex items-center gap-1.5 text-sm font-medium transition",
  chip:
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
};

const chipToneClasses: Record<NonNullable<ActionLinkProps["tone"]>, string> = {
  default:
    "border-border/70 bg-background text-foreground hover:border-primary hover:text-primary",
  primary:
    "border-primary/20 bg-primary/10 text-primary hover:bg-primary/14 hover:text-primary/90",
  muted:
    "border-border/60 bg-white/70 text-muted-foreground hover:border-primary/50 hover:text-foreground",
};

const inlineToneClasses: Record<NonNullable<ActionLinkProps["tone"]>, string> = {
  default: "text-foreground hover:text-primary",
  primary: "text-primary hover:text-primary/80",
  muted: "text-muted-foreground hover:text-foreground",
};

const isExternalHref = (href: string) =>
  href.startsWith("http://") ||
  href.startsWith("https://") ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:");

const opensNewTab = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

export function ActionLink({
  href,
  children,
  icon: Icon,
  className,
  variant = "chip",
  tone = "default",
  external,
}: ActionLinkProps) {
  const isExternal = external ?? isExternalHref(href);
  const toneClass =
    variant === "inline" ? inlineToneClasses[tone] : chipToneClasses[tone];
  const classes = cn(variantClasses[variant], toneClass, className);
  const content = (
    <>
      {Icon ? <Icon className="size-4" /> : null}
      <span>{children}</span>
    </>
  );

  if (isExternal) {
    return (
      <a
        className={classes}
        href={href}
        rel={opensNewTab(href) ? "noreferrer" : undefined}
        target={opensNewTab(href) ? "_blank" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}
