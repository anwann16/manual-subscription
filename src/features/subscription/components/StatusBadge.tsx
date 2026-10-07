import type {
  PaymentStatus,
  SubscriptionStatus,
} from "@/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PAYMENT_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "../helper/format";

/** Warm palette tones, one per lifecycle status, matching the auth surface. */
const subscriptionTone: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "bg-[#F6F2EB] text-[#6F6A62] ring-1 ring-black/[0.06]",
  WAITING_VERIFICATION: "bg-[#F3EFE4] text-[#8A6D3B] ring-1 ring-[#B08D57]/20",
  ACTIVE: "bg-[#EDF1EC] text-[#4F6B52] ring-1 ring-[#8A9A8C]/25",
  REJECTED: "bg-[#FBF1EE] text-[#8E3B33] ring-1 ring-[#B4443A]/15",
  EXPIRED: "bg-[#F1EFEC] text-[#8A8378] ring-1 ring-black/[0.06]",
};

const paymentTone: Record<PaymentStatus, string> = {
  PENDING: "bg-[#F3EFE4] text-[#8A6D3B] ring-1 ring-[#B08D57]/20",
  APPROVED: "bg-[#EDF1EC] text-[#4F6B52] ring-1 ring-[#8A9A8C]/25",
  REJECTED: "bg-[#FBF1EE] text-[#8E3B33] ring-1 ring-[#B4443A]/15",
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-2.5 py-1 text-[0.58rem] tracking-[0.16em]",
        subscriptionTone[status],
        className,
      )}
    >
      {SUBSCRIPTION_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-2.5 py-1 text-[0.58rem] tracking-[0.16em]",
        paymentTone[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
