import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      isActive: boolean;
    };
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      isActive: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: Role;
    isActive?: boolean;
  }
}
