import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/");
  }

  const params = await searchParams;
  const showInactive = params.virhe === "inactive";
  const allowDevSignIn = process.env.NODE_ENV !== "production";

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4 py-12">
      <div className="app-shell-backdrop" />
      <div className="relative w-full max-w-md">
        <Card className="overflow-hidden border-white/10 bg-card/95 shadow-[0_30px_80px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <BrandMark
                className="h-[4.5rem] w-[4.5rem] drop-shadow-[0_18px_34px_rgba(15,23,42,0.16)] sm:h-20 sm:w-20"
                priority
              />
            </div>
            <p className="page-eyebrow">{brand.appName}</p>
            <CardTitle className="text-3xl tracking-tight">{brand.loginTitle}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {brand.loginDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {showInactive ? (
              <Alert>
                <AlertTitle>Käyttäjä ei ole aktiivinen</AlertTitle>
                <AlertDescription>
                  Ota yhteys adminiin, jos tarvitset käyttöoikeuden takaisin.
                </AlertDescription>
              </Alert>
            ) : null}
            <LoginForm allowDevSignIn={allowDevSignIn} />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.24em] text-white/60">
          Kenttäkäyttöön optimoitu näkymä
        </p>
      </div>
    </div>
  );
}
