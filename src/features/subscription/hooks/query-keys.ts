import type { PaymentStatus } from "@/generated/prisma/enums";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  detail: (id: string) => [...subscriptionKeys.all, id] as const,
};

export const planKeys = {
  all: ["plans"] as const,
};

export const adminPaymentKeys = {
  all: ["admin", "payments"] as const,
  list: (status?: PaymentStatus) =>
    [...adminPaymentKeys.all, "list", status ?? "ALL"] as const,
};
