"use client";

import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/generated/prisma/enums";
import {
  formatDate,
  formatDuration,
  formatRupiah,
  PAYMENT_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "../helper/format";
import { useRenewSubscription } from "../hooks/use-renew-subscription";
import type { SubscriptionDTO } from "../subscription.type";
import { PaymentProofForm } from "./PaymentProofForm";
import { PaymentStatusBadge, SubscriptionStatusBadge } from "./StatusBadge";

/** PRD §14: renewal opens for a running, elapsed, or rejected subscription. */
const RENEWABLE: Record<SubscriptionStatus, boolean> = {
  PENDING_PAYMENT: false,
  WAITING_VERIFICATION: false,
  ACTIVE: true,
  REJECTED: true,
  EXPIRED: true,
};

/**
 * PRD §19: one subscription block — plan, period, latest proof, and whatever
 * action that status allows. The upload form lives inside the block instead of on
 * its own route, so paying never leaves the dashboard.
 */
export function SubscriptionCard({
  subscription,
}: {
  subscription: SubscriptionDTO;
}) {
  const renew = useRenewSubscription();
  const { plan, latestPayment } = subscription;

  return (
    <article className="flex flex-col gap-5 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05] transition-shadow duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_36px_70px_-52px_rgba(28,25,23,0.4)]">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-[1.05rem]">{plan.name}</h3>
          <p className="text-[0.82rem] text-[#6F6A62]">
            {formatRupiah(plan.price)} /{" "}
            {formatDuration(plan.duration, plan.durationUnit)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SubscriptionStatusBadge status={subscription.status} />
          {latestPayment &&
          PAYMENT_STATUS_LABEL[latestPayment.status] !==
            SUBSCRIPTION_STATUS_LABEL[subscription.status] ? (
            <PaymentStatusBadge status={latestPayment.status} />
          ) : null}
        </div>
      </header>

      <dl className="flex flex-col gap-2 text-[0.8rem] text-[#6F6A62]">
        <div className="flex justify-between gap-4">
          <dt>Periode</dt>
          <dd className="text-right text-[#1C1917]">
            {subscription.startDate
              ? `${formatDate(subscription.startDate)} — ${formatDate(subscription.endDate)}`
              : "Belum aktif"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Bukti terakhir</dt>
          <dd className="text-[#1C1917]">
            {formatDate(latestPayment?.submittedAt ?? null)}
          </dd>
        </div>
        {latestPayment?.rejectionReason ? (
          <div className="flex flex-col gap-1 rounded-[0.85rem] bg-[#FBF1EE] px-3.5 py-2.5 ring-1 ring-[#B4443A]/15">
            <dt className="text-[0.68rem] tracking-[0.14em] text-[#8E3B33] uppercase">
              Alasan penolakan
            </dt>
            <dd className="text-[0.78rem] leading-relaxed text-[#8E3B33]">
              {latestPayment.rejectionReason}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* PRD §9/§10: the form takes over only while a payment is actually due. */}
      {subscription.status === "PENDING_PAYMENT" ||
      latestPayment?.status === "PENDING" ? (
        <PaymentProofForm subscription={subscription} />
      ) : null}

      {RENEWABLE[subscription.status] ? (
        <div className="flex flex-wrap gap-3 border-t border-black/[0.06] pt-5">
          <Button
            variant="outline"
            size="sm"
            disabled={renew.isPending}
            onClick={() => renew.mutate(subscription.id)}
            className="rounded-full px-5"
          >
            {renew.isPending ? "Mengajukan…" : "Perpanjang langganan"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
