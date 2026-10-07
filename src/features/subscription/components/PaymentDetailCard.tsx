"use client";

import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { AuthNotice } from "@/features/auth/components/AuthNotice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatRupiah,
  PAYMENT_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "../helper/format";
import {
  useApprovePayment,
  useRejectPayment,
} from "../hooks/use-admin-payments";
import type { AdminPaymentDTO } from "../subscription.type";
import { PaymentStatusBadge, SubscriptionStatusBadge } from "./StatusBadge";

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right text-[#1C1917]">{children}</dd>
    </div>
  );
}

/**
 * PRD §11/§12: the whole verification decision lives here. The queue is a list of
 * these blocks, so an admin never navigates away to review a single transfer, and
 * approval stays a single server-side transaction the UI only mirrors.
 */
export function PaymentDetailCard({ payment }: { payment: AdminPaymentDTO }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const approve = useApprovePayment();
  const reject = useRejectPayment();

  const { subscription } = payment;
  /**
   * What an admin can still act on. A card is actionable while its payment is
   * PENDING, and also while the subscription it owns is WAITING_VERIFICATION —
   * that second case is a payment approved before the subscription advanced, and
   * without it the queue would show a stuck record with no way to resolve it.
   */
  const decidable =
    payment.status === "PENDING" ||
    subscription.status === "WAITING_VERIFICATION";
  /** Payment already approved, subscription never advanced: a stuck record. */
  const stuck = payment.status === "APPROVED";

  return (
    <article className="flex flex-col gap-6 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-[1.05rem]">
            {subscription.user.email}
          </h3>
          <p className="text-[0.78rem] text-[#6F6A62]">
            {subscription.plan.name} · {formatRupiah(payment.amount)} · dikirim{" "}
            {formatDateTime(payment.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubscriptionStatusBadge status={subscription.status} />
          {PAYMENT_STATUS_LABEL[payment.status] !==
          SUBSCRIPTION_STATUS_LABEL[subscription.status] ? (
            <PaymentStatusBadge status={payment.status} />
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <section className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[1.25rem] bg-[#F6F2EB]/60 ring-1 ring-black/[0.06]">
            {payment.proofKind === "pdf" ? (
              <object
                data={payment.proofUrl}
                type="application/pdf"
                className="h-[26rem] w-full"
              >
                <p className="p-6 text-[0.82rem] text-[#6F6A62]">
                  Pratinjau PDF tidak tersedia di peramban ini.
                </p>
              </object>
            ) : (
              // The proof URL redirects to a short-lived storage link, so a plain
              // <img> is enough; Next.js image optimization only adds a hop here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={payment.proofUrl}
                alt={`Bukti transfer ${subscription.user.email}`}
                className="max-h-[26rem] w-full object-contain"
              />
            )}
          </div>

          <a
            href={payment.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 text-[0.8rem] font-medium text-[#1C1917] underline decoration-[#C9C3B9] underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:decoration-[#1C1917]"
          >
            Buka berkas asli
            <ExternalLinkIcon strokeWidth={1.25} className="size-3.5" />
          </a>
        </section>

        <section className="flex flex-col gap-5">
          <dl className="flex flex-col gap-2.5 text-[0.8rem] text-[#6F6A62]">
            <Fact label="Paket">{subscription.plan.name}</Fact>
            <Fact label="Durasi">
              {formatDuration(
                subscription.plan.duration,
                subscription.plan.durationUnit,
              )}
            </Fact>
            <Fact label="Nominal">{formatRupiah(payment.amount)}</Fact>
            <Fact label="Verifikasi">
              {payment.verifiedAt
                ? formatDateTime(payment.verifiedAt)
                : "Belum"}
            </Fact>
            <Fact label="Periode saat ini">
              {formatDate(subscription.startDate)} —{" "}
              {formatDate(subscription.endDate)}
            </Fact>
          </dl>

          {payment.rejectionReason ? (
            <AuthNotice message={payment.rejectionReason} />
          ) : null}

          {decidable ? (
            <div className="flex flex-col gap-4 border-t border-black/[0.06] pt-5">
              <p className="text-[0.8rem] leading-relaxed text-[#6F6A62]">
                {stuck
                  ? "Pembayaran ini sudah disetujui tetapi langganannya belum aktif. Menyelesaikan akan mengaktifkan langganan dan menghitung periode dari tanggal ini; Tolak akan menutupnya."
                  : "Approve mengaktifkan langganan dan menghitung periode dari tanggal persetujuan. Reject menutup langganan dan menghentikan alur pembayaran ini."}
              </p>

              {rejecting ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    aria-label="Alasan penolakan"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    rows={3}
                    placeholder="Alasan penolakan (opsional)"
                    className={cn(
                      "w-full resize-y rounded-[0.85rem] bg-[#F6F2EB]/70 px-3.5 py-2.5 text-[0.84rem]",
                      "ring-1 ring-black/[0.05] outline-none transition-[background-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      "placeholder:text-[#B8B1A6] focus-visible:bg-[#FDFCFA] focus-visible:ring-[1.5px] focus-visible:ring-[#1C1917]/20",
                    )}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={reject.isPending}
                      onClick={() =>
                        reject.mutate({
                          paymentId: payment.id,
                          rejectionReason: rejectionReason.trim() || undefined,
                        })
                      }
                      className="rounded-full px-5"
                    >
                      {reject.isPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <XIcon strokeWidth={1.25} className="size-3.5" />
                      )}
                      <span>Konfirmasi tolak</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRejecting(false)}
                      className="rounded-full px-5"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(payment.id)}
                    className="rounded-full px-5"
                  >
                    {approve.isPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <CheckIcon strokeWidth={1.25} className="size-3.5" />
                    )}
                    <span>{stuck ? "Selesaikan" : "Approve"}</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejecting(true)}
                    className="rounded-full px-5"
                  >
                    <XIcon strokeWidth={1.25} className="size-3.5" />
                    <span>Reject</span>
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
