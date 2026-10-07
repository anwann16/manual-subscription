import type {
  DurationUnit,
  PaymentStatus,
  SubscriptionStatus,
} from "@/generated/prisma/enums";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const longDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const longDateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatRupiah = (value: number) => rupiah.format(value);

export const formatDate = (value: string | null) =>
  value ? longDate.format(new Date(value)) : "—";

export const formatDateTime = (value: string | null) =>
  value ? longDateTime.format(new Date(value)) : "—";

const UNIT_LABEL: Record<DurationUnit, string> = {
  DAY: "hari",
  MONTH: "bulan",
  YEAR: "tahun",
};

export const formatDuration = (duration: number, unit: DurationUnit) =>
  `${duration} ${UNIT_LABEL[unit]}`;

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  ACTIVE: "Aktif",
  REJECTED: "Ditolak",
  EXPIRED: "Berakhir",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Menunggu Verifikasi",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

/** PRD §9: the accepted proof formats, shared by the picker and the copy. */
export const PROOF_ACCEPT = ".jpg,.jpeg,.png,.pdf";
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
