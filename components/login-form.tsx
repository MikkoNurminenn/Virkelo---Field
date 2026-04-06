"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { LaptopMinimalCheckIcon, MailIcon, ShieldCheckIcon } from "lucide-react";
import { signIn } from "next-auth/react";

import { devQuickLoginAction } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const LoginForm = ({ allowDevSignIn = false }: { allowDevSignIn?: boolean }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const redirectTo = "/";
  const getEmailValue = () => emailRef.current?.value.trim() ?? "";
  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const email = getEmailValue();

    if (!email) {
      setMessage("Syötä työsähköposti ennen kirjautumista.");
      return;
    }

    startTransition(async () => {
      const result = await signIn(allowDevSignIn ? "dev-login" : "resend", {
        email,
        redirect: false,
        redirectTo,
      });

      if (result?.error) {
        setMessage(
          allowDevSignIn
            ? "Kehityskirjautuminen epäonnistui."
            : "Kirjautumislinkin lähetys epäonnistui.",
        );
        return;
      }

      if (allowDevSignIn) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setMessage("Kirjautumislinkki lähetettiin sähköpostiin.");
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {allowDevSignIn ? (
        <form action={devQuickLoginAction} className="space-y-3">
          <input name="email" type="hidden" value="admin@pgpputki.fi" />
          <Button className="w-full" size="lg" type="submit">
            <ShieldCheckIcon data-icon="inline-start" />
            Kirjaudu adminina yhdellä napilla
          </Button>
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground">
            Puhelimella nopein tapa testata on yllä oleva admin-nappi. Voit myös syöttää oman
            sähköpostin alle ja kirjautua sillä.
          </div>
        </form>
      ) : null}

      <form className="flex flex-col gap-5" onSubmit={handleEmailSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Työsähköposti</FieldLabel>
            <Input
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="done"
              id="email"
              name="email"
              placeholder="etunimi.sukunimi@yritys.fi"
              required
              ref={emailRef}
              type="email"
            />
            <FieldDescription>
              Käytä yrityksen sähköpostia. Linkki toimii ilman salasanaa.
            </FieldDescription>
          </Field>
        </FieldGroup>

        {message ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}

        <Button disabled={isPending} type="submit" variant={allowDevSignIn ? "outline" : "default"}>
          {allowDevSignIn ? (
            <LaptopMinimalCheckIcon data-icon="inline-start" />
          ) : (
            <MailIcon data-icon="inline-start" />
          )}
          {allowDevSignIn
            ? isPending
              ? "Kirjaudutaan..."
              : "Kirjaudu syötetyllä sähköpostilla"
            : isPending
              ? "Lähetetään..."
              : "Lähetä kirjautumislinkki"}
        </Button>
      </form>
    </div>
  );
};
