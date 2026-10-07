import type { SubscriptionStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SubscriptionError } from "./helper/http";
import { computePeriod } from "./helper/period";
import {
  adminPaymentInclude,
  serializeAdminPayment,
  serializePlan,
  serializeSubscription,
  subscriptionInclude,
  type AdminPaymentRow,
} from "./serialize";
import type {
  AdminPaymentDTO,
  PlanDTO,
  SubscriptionDTO,
} from "./subscription.type";

/**
 * Payload for the single `/dashboard` route: the signed-in user plus every list
 * the page renders, so the UI never re-fetches on hydration.
 */
export type Workspace = {
  subscriptions: SubscriptionDTO[];
  /** Verification queue; empty for non-admins. */
  payments: AdminPaymentDTO[];
  isAdmin: boolean;
  plans: PlanDTO[];
  email: string;
  memberSince: string | null;
  /** Platform-wide counters for the admin summary; `null` for non-admins. */
  stats: { userCount: number; pendingCount: number } | null;
};

/** Statuses that still occupy a plan slot for a user. */
const OPEN_STATUSES: readonly SubscriptionStatus[] = [
  "PENDING_PAYMENT",
  "WAITING_VERIFICATION",
];

/** Statuses from which a renewal request is legal (PRD §7, §14). */
const RENEWABLE_STATUSES: readonly SubscriptionStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "REJECTED",
];

/**
 * PRD §5/§7: ACTIVE → EXPIRED once `endDate` lapses. Swept inside reads so the
 * stored status never contradicts the period the UI renders.
 */
async function expireLapsedSubscriptions() {
  return prisma.subscription.updateMany({
    where: { status: "ACTIVE", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

export async function listActivePlans(): Promise<PlanDTO[]> {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return plans.map(serializePlan);
}

export async function listSubscriptions(
  userId: string,
): Promise<SubscriptionDTO[]> {
  await expireLapsedSubscriptions();

  const rows = await prisma.subscription.findMany({
    where: { userId },
    include: subscriptionInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(serializeSubscription);
}

/** Scoped read: another user's subscription is indistinguishable from a 404. */
export async function getSubscription(
  userId: string,
  subscriptionId: string,
): Promise<SubscriptionDTO> {
  await expireLapsedSubscriptions();

  const row = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    include: subscriptionInclude,
  });

  if (!row) {
    throw new SubscriptionError(
      404,
      "SUBSCRIPTION_NOT_FOUND",
      "Langganan tidak ditemukan.",
    );
  }

  return serializeSubscription(row);
}

/** PRD §8: the client sends only `planId`; price/duration come from the plan. */
export async function createSubscription(
  userId: string,
  planId: string,
): Promise<SubscriptionDTO> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new SubscriptionError(
      404,
      "PLAN_NOT_FOUND",
      "Paket tidak ditemukan.",
    );
  }
  if (!plan.isActive) {
    throw new SubscriptionError(
      409,
      "PLAN_INACTIVE",
      "Paket ini sudah tidak tersedia.",
    );
  }

  const openSubscription = await prisma.subscription.findFirst({
    where: { userId, planId, status: { in: [...OPEN_STATUSES] } },
    select: { id: true },
  });

  if (openSubscription) {
    throw new SubscriptionError(
      409,
      "SUBSCRIPTION_ALREADY_OPEN",
      "Sudah ada pengajuan berjalan untuk paket ini.",
    );
  }

  const created = await prisma.subscription.create({
    data: { userId, planId },
    include: subscriptionInclude,
  });

  return serializeSubscription(created);
}

/**
 * PRD §9/§10/§12: the object is already in the bucket when this runs, so the
 * payment insert and the status transition share one transaction. A failure rolls
 * the subscription back and the caller deletes the orphaned object.
 */
export async function submitPayment(
  userId: string,
  subscriptionId: string,
  proofKey: string,
): Promise<SubscriptionDTO> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new SubscriptionError(
      404,
      "SUBSCRIPTION_NOT_FOUND",
      "Langganan tidak ditemukan.",
    );
  }

  if (subscription.status === "EXPIRED") {
    throw new SubscriptionError(
      409,
      "SUBSCRIPTION_EXPIRED",
      "Langganan sudah berakhir. Ajukan perpanjangan terlebih dahulu.",
    );
  }

  if (subscription.status !== "PENDING_PAYMENT") {
    throw new SubscriptionError(
      409,
      "INVALID_STATUS_TRANSITION",
      "Langganan ini tidak sedang menunggu pembayaran.",
    );
  }

  const pendingPayment = await prisma.payment.findFirst({
    where: { subscriptionId, status: "PENDING" },
    select: { id: true },
  });

  if (pendingPayment) {
    throw new SubscriptionError(
      409,
      "DUPLICATE_PAYMENT",
      "Masih ada pembayaran yang menunggu verifikasi.",
    );
  }

  const [, updated] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        subscriptionId,
        amount: subscription.plan.price,
        proofKey,
      },
    }),
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "WAITING_VERIFICATION" },
      include: subscriptionInclude,
    }),
  ]);

  return serializeSubscription(updated);
}

/**
 * PRD §14: renewal reopens the subscription for a fresh payment. The dates are
 * not touched here — they still hold the period being extended, and
 * `approvePayment` uses that as the anchor for the new period.
 */
export async function renewSubscription(
  userId: string,
  subscriptionId: string,
): Promise<SubscriptionDTO> {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    select: { id: true, status: true },
  });

  if (!subscription) {
    throw new SubscriptionError(
      404,
      "SUBSCRIPTION_NOT_FOUND",
      "Langganan tidak ditemukan.",
    );
  }

  if (!RENEWABLE_STATUSES.includes(subscription.status)) {
    throw new SubscriptionError(
      409,
      "INVALID_STATUS_TRANSITION",
      "Perpanjangan hanya tersedia untuk langganan aktif, berakhir, atau ditolak.",
    );
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "PENDING_PAYMENT" },
    include: subscriptionInclude,
  });

  return serializeSubscription(updated);
}

/**
 * Everything `/dashboard` renders, resolved from the server session in one
 * round-trip: the user's subscriptions, the payment queue (admins only), and the
 * current user. The dashboard is the only page, so it owns its own read instead
 * of fanning out to the JSON API on hydration.
 */
export async function getWorkspace(user: {
  id: string;
  role: UserRole;
}): Promise<Workspace> {
  await expireLapsedSubscriptions();

  const [subscriptions, payments, productPlans, account] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: user.id },
      include: subscriptionInclude,
      orderBy: { createdAt: "desc" },
    }),
    // PRD §11: only an admin has a verification queue to work.
    user.role === "ADMIN"
      ? prisma.payment.findMany({
          include: adminPaymentInclude,
          // Oldest first: the verification queue is FIFO.
          orderBy: { submittedAt: "asc" },
        })
      : Promise.resolve([]),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, createdAt: true },
    }),
  ]);

  const isAdmin = user.role === "ADMIN";

  return {
    subscriptions: subscriptions.map(serializeSubscription),
    payments: payments.map(serializeAdminPayment),
    isAdmin,
    plans: productPlans.map(serializePlan),
    email: account?.email ?? "",
    memberSince: account?.createdAt.toISOString() ?? null,
    // PRD §11: only the admin summary surface needs platform-wide counts.
    stats: isAdmin
      ? {
          // Only end users: the admin summary must not count accounts that
          // administer the platform.
          userCount: await prisma.user.count({ where: { role: "USER" } }),
          pendingCount: payments.filter((p) => p.status === "PENDING").length,
        }
      : null,
  };
}

/**
 * PRD §11: platform-wide counters for the admin summary. Separate from
 * `getWorkspace` so `GET /api/admin/stats` never pays for the dashboard's
 * subscription and plan reads just to render two numbers.
 */
export async function getPlatformStats(): Promise<{
  userCount: number;
  pendingCount: number;
}> {
  const [userCount, pendingCount] = await Promise.all([
    // Only end users: accounts that administer the platform are not users of it.
    prisma.user.count({ where: { role: "USER" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ]);

  return { userCount, pendingCount };
}

/**
 * PRD §18: the proof key is only ever released to the subscription owner or an
 * admin. Both the ownership check and the authorization decision happen here, so
 * the storage route never has to trust anything the client sent. A payment the
 * caller may not see is reported as a plain 404, exactly like a missing row.
 */
export async function getProofKey(
  user: { id: string; role: UserRole },
  paymentId: string,
): Promise<string> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { proofKey: true, subscription: { select: { userId: true } } },
  });

  if (!payment) {
    throw new SubscriptionError(
      404,
      "PAYMENT_NOT_FOUND",
      "Pembayaran tidak ditemukan.",
    );
  }

  const isOwner = payment.subscription.userId === user.id;
  if (!isOwner && user.role !== "ADMIN") {
    throw new SubscriptionError(
      404,
      "PAYMENT_NOT_FOUND",
      "Pembayaran tidak ditemukan.",
    );
  }

  return payment.proofKey;
}

/**
 * PRD §11/§12/§13: approval is business-critical, so the payment update and the
 * subscription activation commit together — never a half-approved state.
 */
export async function approvePayment(
  adminId: string,
  paymentId: string,
): Promise<AdminPaymentDTO> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment) {
    throw new SubscriptionError(
      404,
      "PAYMENT_NOT_FOUND",
      "Pembayaran tidak ditemukan.",
    );
  }

  /**
   * A payment already APPROVED whose subscription never left
   * WAITING_VERIFICATION (an approval that failed to advance the subscription)
   * is finished here instead of being rejected, so the admin can clear the
   * record instead of being stuck on a queue item with no legal action.
   */
  const alreadyApproved = payment.status === "APPROVED";

  if (payment.status !== "PENDING" && !alreadyApproved) {
    throw new SubscriptionError(
      409,
      "PAYMENT_ALREADY_PROCESSED",
      "Pembayaran ini sudah diproses.",
    );
  }

  if (payment.subscription.status !== "WAITING_VERIFICATION") {
    throw new SubscriptionError(
      409,
      "INVALID_STATUS_TRANSITION",
      "Langganan tidak berada pada status menunggu verifikasi.",
    );
  }

  const verifiedAt = new Date();

  /**
   * PRD §14: the new period starts after any period the user is still running.
   * Two anchors can apply — the row being activated (a renewal, whose own
   * `endDate` is the period it is extending) and any other live subscription (a
   * new plan queued behind one already running). The farthest wins, so a renewal
   * extends from its own period while a fresh plan still queues behind the
   * active one; `null` when neither applies starts the period at approval time.
   */
  await expireLapsedSubscriptions();

  const running = await prisma.subscription.aggregate({
    where: {
      userId: payment.subscription.userId,
      status: "ACTIVE",
      id: { not: payment.subscriptionId },
    },
    _max: { endDate: true },
  });

  const otherEndDate = running._max.endDate;
  const ownEndDate = payment.subscription.endDate;
  const previousEndDate =
    otherEndDate && ownEndDate
      ? new Date(Math.max(otherEndDate.getTime(), ownEndDate.getTime()))
      : (otherEndDate ?? ownEndDate);

  const { startDate, endDate } = computePeriod(
    verifiedAt,
    payment.subscription.plan.duration,
    payment.subscription.plan.durationUnit,
    previousEndDate,
  );

  return prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "ACTIVE", startDate, endDate },
    });

    const updated: AdminPaymentRow = await tx.payment.update({
      where: { id: paymentId },
      data: alreadyApproved
        ? { verifiedById: adminId }
        : { status: "APPROVED", verifiedAt, verifiedById: adminId },
      include: adminPaymentInclude,
    });

    return serializeAdminPayment(updated);
  });
}

/** PRD §11: rejection closes the subscription too, optionally with a reason. */
export async function rejectPayment(
  adminId: string,
  paymentId: string,
  rejectionReason?: string,
): Promise<AdminPaymentDTO> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, subscriptionId: true },
  });

  if (!payment) {
    throw new SubscriptionError(
      404,
      "PAYMENT_NOT_FOUND",
      "Pembayaran tidak ditemukan.",
    );
  }

  /**
   * Mirror approvePayment: an APPROVED payment whose subscription is still
   * WAITING_VERIFICATION may still be rejected, so either decision can clear it.
   */
  if (payment.status !== "PENDING" && payment.status !== "APPROVED") {
    throw new SubscriptionError(
      409,
      "PAYMENT_ALREADY_PROCESSED",
      "Pembayaran ini sudah diproses.",
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "REJECTED" },
    });

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        verifiedAt: new Date(),
        verifiedById: adminId,
        rejectionReason: rejectionReason?.trim()
          ? rejectionReason.trim()
          : null,
      },
      include: adminPaymentInclude,
    });

    return serializeAdminPayment(updated);
  });
}
