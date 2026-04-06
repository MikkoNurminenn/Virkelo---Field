import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

export const requireCurrentUser = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/kirjaudu");
  }

  if (!user.isActive) {
    redirect("/kirjaudu?virhe=inactive");
  }

  return user;
};
