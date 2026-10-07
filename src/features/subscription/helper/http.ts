import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";

/**
 * Domain failures mapped to HTTP responses. Every subscription endpoint returns
 * the same `{ error, code }` shape so the client can surface one message.
 */
export class SubscriptionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof SubscriptionError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  // `Payment_subscriptionId_pending_key` race: two uploads slipped past the
  // pre-check, the database kept the invariant.
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        error: "Masih ada pembayaran yang menunggu verifikasi.",
        code: "DUPLICATE_PAYMENT",
      },
      { status: 409 },
    );
  }

  console.error("[subscription:api]", error);
  return NextResponse.json(
    { error: "Terjadi kesalahan pada server.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

/**
 * `src/proxy.ts` deliberately skips `/api/**`, so route handlers authorize
 * themselves. Read the session directly: `requireUser`/`requireAdmin` redirect,
 * which is meaningless for an API response.
 */
export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new SubscriptionError(
      401,
      "UNAUTHORIZED",
      "Silakan masuk terlebih dahulu.",
    );
  }
  return session.user;
}

export async function requireApiAdmin() {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") {
    throw new SubscriptionError(
      403,
      "FORBIDDEN",
      "Hanya admin yang dapat mengakses endpoint ini.",
    );
  }
  return user;
}

/** Reads a JSON body, tolerating a missing or malformed payload. */
export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
