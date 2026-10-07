import { Prisma } from "@/generated/prisma/client";
import type {
  AdminPaymentDTO,
  PaymentDTO,
  PlanDTO,
  SubscriptionDTO,
} from "./subscription.type";

/** Relations every subscription read needs; the type below stays in sync. */
export const subscriptionInclude = {
  plan: true,
  payments: { orderBy: { submittedAt: "desc" } },
} as const satisfies Prisma.SubscriptionInclude;

export const adminPaymentInclude = {
  subscription: { include: { plan: true, user: true } },
} as const satisfies Prisma.PaymentInclude;

export type SubscriptionRow = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionInclude;
}>;

export type AdminPaymentRow = Prisma.PaymentGetPayload<{
  include: typeof adminPaymentInclude;
}>;

export function serializePlan(plan: {
  id: string;
  name: string;
  description: string;
  price: Prisma.Decimal;
  duration: number;
  durationUnit: PlanDTO["durationUnit"];
  isActive: boolean;
}): PlanDTO {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    // Decimal is not JSON-serializable as a number; the client always sees rupiah.
    price: plan.price.toNumber(),
    duration: plan.duration,
    durationUnit: plan.durationUnit,
    isActive: plan.isActive,
  };
}

export function serializePayment(payment: {
  id: string;
  subscriptionId: string;
  amount: Prisma.Decimal;
  status: PaymentDTO["status"];
  proofKey: string;
  submittedAt: Date;
  verifiedAt: Date | null;
  verifiedById: string | null;
  rejectionReason: string | null;
}): PaymentDTO {
  return {
    id: payment.id,
    subscriptionId: payment.subscriptionId,
    amount: payment.amount.toNumber(),
    status: payment.status,
    // Never a storage URL: the bucket is private, so clients go through the
    // session-checked route, which redirects to a short-lived presigned GET.
    proofUrl: `/api/payments/${payment.id}/proof`,
    proofKind: payment.proofKey.endsWith(".pdf") ? "pdf" : "image",
    submittedAt: payment.submittedAt.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    verifiedById: payment.verifiedById,
    rejectionReason: payment.rejectionReason,
  };
}

export function serializeSubscription(row: SubscriptionRow): SubscriptionDTO {
  const payments = row.payments.map(serializePayment);

  return {
    id: row.id,
    userId: row.userId,
    planId: row.planId,
    status: row.status,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    plan: serializePlan(row.plan),
    payments,
    latestPayment: payments[0],
  };
}

export function serializeAdminPayment(row: AdminPaymentRow): AdminPaymentDTO {
  return {
    ...serializePayment(row),
    subscription: {
      id: row.subscription.id,
      userId: row.subscription.userId,
      status: row.subscription.status,
      startDate: row.subscription.startDate?.toISOString() ?? null,
      endDate: row.subscription.endDate?.toISOString() ?? null,
      plan: serializePlan(row.subscription.plan),
      user: {
        id: row.subscription.user.id,
        email: row.subscription.user.email,
      },
    },
  };
}
