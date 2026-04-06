"use client";

import { LogOutIcon } from "lucide-react";

import { signOutAction } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";

export const SignOutButton = ({
  className,
  size = "default",
  variant = "outline",
}: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}) => (
  <form action={signOutAction} className="inline-flex">
    <Button className={className} size={size} type="submit" variant={variant}>
      <LogOutIcon data-icon="inline-start" />
      Kirjaudu ulos
    </Button>
  </form>
);
