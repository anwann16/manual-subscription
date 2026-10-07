import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side session accessor. PRD §18: the client is never trusted, so every
 * page/action re-resolves the session from the signed cookie on the server.
 */
export const getSession = cache(async () => auth());

/** Redirects unauthenticated visitors to the login page. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/** Requires the ADMIN role; authenticated non-admins are sent to /dashboard. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
