// Next.js 16 replaced `middleware.ts` with `proxy.ts` (Node.js runtime only).
// `auth` already wraps the request with the `authorized` callback defined in
// `auth.ts`, which is the single source of truth for the redirect rules.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // Skip Next.js internals, the NextAuth endpoints, and static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
