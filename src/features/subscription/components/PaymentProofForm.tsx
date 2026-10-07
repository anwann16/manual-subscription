"use client";

import { useState } from "react";
import { FileUpIcon, UploadIcon } from "lucide-react";

import { AuthNotice } from "@/features/auth/components/AuthNotice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SubscriptionDTO } from "../subscription.type";
import { PROOF_ACCEPT, PROOF_MAX_BYTES, formatRupiah } from "../helper/format";
import { useSubmitPaymentProof } from "../hooks/use-submit-payment-proof";
import { PaymentStatusBadge, SubscriptionStatusBadge } from "./StatusBadge";

/**
 * PRD §9: the picker enforces the same limits the API enforces, purely as UX —
 * the backend re-validates type and size and is the source of truth.
 */
function localValidationError(file: File): string | undefined {
  const accepted = ["image/jpeg", "image/png", "application/pdf"];
  if (!accepted.includes(file.type)) {
    return "Format file harus JPG, JPEG, PNG, atau PDF.";
  }
  if (file.size > PROOF_MAX_BYTES) {
    return "Ukuran file maksimal 5 MB.";
  }
  return undefined;
}

export function PaymentProofForm({
  subscription,
}: {
  subscription: SubscriptionDTO;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>();
  const submit = useSubmitPaymentProof(subscription.id);

  const latestPending = subscription.latestPayment?.status === "PENDING";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setValidationError(selected ? localValidationError(selected) : undefined);
    setFile(selected);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setValidationError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    const error = localValidationError(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(undefined);
    submit.mutate(file);
  }

  // PRD §10: one outstanding payment per subscription; the API enforces this too.
  if (latestPending) {
    return (
      <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-[1.05rem]">Bukti sudah dikirim</h2>
          <PaymentStatusBadge status="PENDING" />
        </div>
        <p className="text-[0.82rem] leading-relaxed text-[#6F6A62]">
          Pembayaran sebesar {formatRupiah(subscription.latestPayment!.amount)}{" "}
          sedang menunggu verifikasi admin. Pengiriman ulang dinonaktifkan
          sampai admin memproses bukti ini.
        </p>
        <a
          href={subscription.latestPayment!.proofUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit text-[0.8rem] font-medium text-[#1C1917] underline decoration-[#C9C3B9] underline-offset-4 hover:decoration-[#1C1917]"
        >
          Lihat bukti yang diunggah
        </a>
      </div>
    );
  }

  if (subscription.status !== "PENDING_PAYMENT") {
    return (
      <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-[1.05rem]">
            Pembayaran tidak tersedia
          </h2>
          <SubscriptionStatusBadge status={subscription.status} />
        </div>
        <p className="text-[0.82rem] leading-relaxed text-[#6F6A62]">
          Langganan ini tidak sedang menunggu pembayaran. Lakukan perpanjangan
          dari halaman Dashboard sebelum mengunggah bukti baru.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05]"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-[1.05rem]">Unggah bukti transfer</h2>
        <p className="text-[0.82rem] leading-relaxed text-[#6F6A62]">
          Transfer {formatRupiah(subscription.plan.price)} untuk paket{" "}
          {subscription.plan.name}, lalu unggah bukti dalam format JPG, JPEG,
          PNG, atau PDF (maksimal 5 MB).
        </p>
      </div>

      <AuthNotice message={validationError} />

      <label
        htmlFor="proof"
        className="flex cursor-pointer flex-col items-center gap-3 rounded-[1.25rem] border border-dashed border-black/[0.12] bg-[#F6F2EB]/50 px-6 py-8 text-center transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#F6F2EB]"
      >
        <span className="grid size-10 place-items-center rounded-full bg-[#1C1917] text-[#FBF9F5]">
          <FileUpIcon strokeWidth={1.25} className="size-4" />
        </span>
        <span className="text-[0.84rem] font-medium text-[#1C1917]">
          {file ? file.name : "Pilih file bukti transfer"}
        </span>
        <span className="text-[0.72rem] text-[#8A8378]">
          {file
            ? file.size < 1024
              ? `${file.size} B`
              : `${(file.size / 1024).toFixed(0)} KB`
            : "JPG, JPEG, PNG, atau PDF — maksimal 5 MB"}
        </span>
        <input
          id="proof"
          name="proof"
          type="file"
          accept={PROOF_ACCEPT}
          onChange={handleChange}
          aria-invalid={Boolean(validationError)}
          className="sr-only"
        />
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={submit.isPending}
        className="h-11 self-start rounded-full px-6 text-[0.66rem] tracking-[0.18em]"
      >
        {submit.isPending ? (
          <Spinner className="size-4" />
        ) : (
          <UploadIcon strokeWidth={1.25} className="size-4" />
        )}
        <span>{submit.isPending ? "Mengunggah…" : "Kirim Bukti"}</span>
      </Button>
    </form>
  );
}
