import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Credentials + JWT sessions: the ERD has no Account/Session/VerificationToken
// tables, so a database adapter is deliberately not used. Authorization decisions
// are re-derived server-side on every request from the signed session cookie.
const config: NextAuthConfig = {
  // The app is not always behind a known proxy host (local dev, preview URLs).
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Same result for unknown email and wrong password: no account enumeration.
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );
        if (!passwordMatches) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on sign-in; the JWT then carries id + role.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      // Public routes: /login and /register must stay reachable while anonymous.
      if (pathname === "/login" || pathname === "/register") return true;

      if (!auth?.user) return false;

      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        if (auth.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
        }
      }

      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
