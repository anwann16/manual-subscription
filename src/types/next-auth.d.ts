import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

// The callback `token` parameter is typed from `@auth/core/jwt`; augmenting the
// re-export shim (`next-auth/jwt`) does not merge with the original interface.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
