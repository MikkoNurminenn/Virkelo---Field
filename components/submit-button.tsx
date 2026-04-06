"use client";

import { Loader2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
};

export const SubmitButton = ({
  children,
  pendingLabel = "Tallennetaan...",
  variant = "default",
  size = "default",
  className,
}: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button className={className} disabled={pending} type="submit" variant={variant} size={size}>
      {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
};
