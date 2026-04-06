"use server";

import { signIn, signOut } from "@/auth";

export const devQuickLoginAction = async (formData: FormData) => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Kehityskirjautuminen ei ole käytössä tuotannossa.");
  }

  const email = formData.get("email");

  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Sähköposti puuttuu.");
  }

  await signIn("dev-login", {
    email: email.trim().toLowerCase(),
    redirectTo: "/",
  });
};

export const signOutAction = async () => {
  await signOut({
    redirectTo: "/kirjaudu",
  });
};
