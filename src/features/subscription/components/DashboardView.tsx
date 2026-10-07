"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AuthNotice } from "@/features/auth/components/AuthNotice";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Workspace } from "../dal";
import type { SubscriptionStatus } from "@/generated/prisma/enums";
import { formatDate, formatRupiah } from "../helper/format";
import { useCreateSubscription } from "../hooks/use-subscriptions";
import { useRenewSubscription } from "../hooks/use-renew-subscription";
import type {
  AdminPaymentDTO,
  PlanDTO,
  SubscriptionDTO,
  WorkspaceView,
} from "../subscription.type";
import { Bezel } from "./Bezel";
import { PaymentDetailCard } from "./PaymentDetailCard";
import { PlanCard } from "./PlanCard";
import { SubscriptionCard } from "./SubscriptionCard";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  WAITING_VERIFICATION: "Menunggu verifikasi",
  ACTIVE: "Aktif",
  REJECTED: "Ditolak",
  EXPIRED: "Berakhir",
};

type PendingPayment = { id: string; status: SubscriptionStatus };

function SectionHeading({
  id,
  eyebrow,
  title,
  aside,
}: {
  id: string;
  eyebrow: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <header
      id={id}
      className="auth-rise flex scroll-mt-28 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-[#EFEAE2]/70 px-3 py-1 text-[0.58rem] tracking-[0.22em] text-[#8A8378] uppercase ring-1 ring-black/[0.06]">
          {eyebrow}
        </span>
        <h2 className="font-heading text-[1.6rem] leading-tight tracking-[-0.02em]">
          {title}
        </h2>
      </div>
      {aside}
    </header>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[1.5rem] bg-[#FDFCFA] px-6 py-10 text-center text-[0.84rem] text-[#8A8378] ring-1 ring-black/[0.05]">
      {children}
    </p>
  );
}

function PlanTile({ plan }: { plan: PlanDTO }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-[1.25rem] bg-[#FDFCFA] px-5 py-4 ring-1 ring-black/[0.05]">
      <span className="flex flex-col gap-0.5">
        <span className="text-[0.86rem] font-medium text-[#1C1917]">
          {plan.name}
        </span>
        <span className="text-[0.74rem] text-[#8A8378]">
          {plan.description}
        </span>
      </span>
      <span className="shrink-0 text-[0.82rem] text-[#1C1917]">
        {formatRupiah(plan.price)}
      </span>
    </div>
  );
}

/** PRD §14: pending, verified, and rejected submissions, newest first. */
function HistoryList({ subscriptions }: { subscriptions: SubscriptionDTO[] }) {
  const rows = subscriptions.flatMap((subscription) =>
    subscription.payments.map((payment) => ({ subscription, payment })),
  );
  rows.sort(
    (a, b) =>
      new Date(b.payment.submittedAt).getTime() -
      new Date(a.payment.submittedAt).getTime(),
  );

  if (rows.length === 0) {
    return <EmptyState>Belum ada bukti pembayaran yang dikirim.</EmptyState>;
  }

  return (
    <ol className="flex flex-col">
      {rows.map(({ subscription, payment }) => (
        <li
          key={payment.id}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] py-4 first:border-t-0"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-[0.86rem] text-[#1C1917]">
              {subscription.plan.name} · {formatRupiah(payment.amount)}
            </span>
            <span className="text-[0.74rem] text-[#8A8378]">
              Dikirim {formatDate(payment.submittedAt)}
              {payment.verifiedAt
                ? ` · diverifikasi ${formatDate(payment.verifiedAt)}`
                : ""}
            </span>
          </span>
          <span className="flex items-center gap-3">
            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[0.76rem] font-medium text-[#1C1917] underline decoration-[#C9C3B9] underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:decoration-[#1C1917]"
            >
              Bukti
            </a>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.58rem] tracking-[0.16em] uppercase",
                payment.status === "PENDING" && "bg-[#F3EFE4] text-[#8A6D3B]",
                payment.status === "APPROVED" && "bg-[#EDF1EC] text-[#4F6B52]",
                payment.status === "REJECTED" && "bg-[#FBF1EE] text-[#8E3B33]",
              )}
            >
              {payment.status === "PENDING"
                ? "Menunggu"
                : payment.status === "APPROVED"
                  ? "Disetujui"
                  : "Ditolak"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const PAYMENT_FILTERS = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
] as const;

function AdminQueue({ payments }: { payments: AdminPaymentDTO[] }) {
  const [filter, setFilter] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "ALL"
  >("PENDING");

  const visible =
    filter === "ALL"
      ? payments
      : payments.filter((payment) => payment.status === filter);

  return (
    <div className="flex flex-col gap-5">
      {/* Secondary filter: separate from the sidebar, which owns the view. */}
      <div
        role="radiogroup"
        aria-label="Filter pembayaran"
        className="flex flex-wrap gap-1.5 rounded-full bg-[#F1ECE4] p-1.5 ring-1 ring-black/[0.05]"
      >
        {PAYMENT_FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-full px-4 py-2 text-[0.62rem] tracking-[0.18em] uppercase",
                "transition-[background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "bg-[#1C1917] text-[#FBF9F5] shadow-[0_10px_20px_-16px_rgba(28,25,23,0.9)]"
                  : "text-[#8A8378] hover:bg-[#FDFCFA] hover:text-[#1C1917]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          {filter === "PENDING"
            ? "Tidak ada pembayaran yang menunggu verifikasi."
            : "Tidak ada pembayaran pada filter ini."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {visible.map((payment) => (
            <PaymentDetailCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Admin summary tile: one headline number with the context that explains it. */
function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Bezel variant="tray">
      <div className="flex h-full flex-col justify-between gap-6">
        <span className="text-[0.62rem] tracking-[0.2em] text-[#8A8378] uppercase">
          {label}
        </span>
        <div className="flex flex-col gap-1.5">
          <span
            className={cn(
              "font-heading text-[clamp(2.4rem,5vw,3.4rem)] leading-none tracking-[-0.03em]",
              accent ? "text-[#B4443A]" : "text-[#1C1917]",
            )}
          >
            {value}
          </span>
          <span className="text-[0.78rem] text-[#6F6A62]">{hint}</span>
        </div>
      </div>
    </Bezel>
  );
}

/**
 * The dashboard is the only authenticated route: one server read resolved from
 * the session, then a panel chosen by the shell sidebar. Nothing here navigates
 * away, so paying, renewing, and verifying never reload the page.
 */
export function DashboardView({
  workspace,
  view,
}: {
  workspace: Workspace;
  view: WorkspaceView;
}) {
  const { subscriptions, payments, plans, email, memberSince } = workspace;
  const isAdmin = payments.length > 0 || workspace.isAdmin;
  const create = useCreateSubscription();
  const renew = useRenewSubscription();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const latestPerPlan: Record<string, PendingPayment> = {};
  for (const subscription of subscriptions) {
    latestPerPlan[subscription.planId] ??= {
      id: subscription.id,
      status: subscription.status,
    };
  }

  const active = subscriptions.find(
    (subscription) => subscription.status === "ACTIVE",
  );
  const needsAttention = subscriptions.filter(
    (subscription) => subscription.status === "PENDING_PAYMENT",
  );

  function startSubscription(planId: string) {
    if (latestPerPlan[planId]) return;

    setPendingPlanId(planId);
    create.mutate(planId, {
      onSuccess: () => toast.success("Pengajuan langganan dibuat"),
      onSettled: () => setPendingPlanId(null),
    });
  }

  return (
    <div className="flex flex-col gap-12 pb-24 lg:gap-16">
      {/* §17: the hero states position first — plan, status, and what to do next.
          Admins own no subscription, so their surface is the summary cards only. */}
      {!isAdmin ? (
        <section className="auth-rise grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Bezel variant="tray" className="lg:min-h-[22rem]">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex flex-col gap-4">
                <span className="w-fit rounded-full bg-[#EFEAE2]/70 px-3 py-1 text-[0.58rem] tracking-[0.22em] text-[#8A8378] uppercase ring-1 ring-black/[0.06]">
                  {isAdmin ? "Admin workspace" : "Dashboard"}
                </span>
                <h1 className="font-heading text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.02] tracking-[-0.03em] text-balance">
                  {active ? (
                    <>
                      {active.plan.name}, aktif sampai{" "}
                      <span className="italic text-[#8A9A8C]">
                        {formatDate(active.endDate)}
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Belum ada paket{" "}
                      <span className="italic text-[#8A9A8C]">berjalan</span>.
                    </>
                  )}
                </h1>
                <p className="max-w-lg text-[0.86rem] leading-relaxed text-[#6F6A62]">
                  {needsAttention.length > 0
                    ? `${needsAttention.length} langganan menunggu pembayaran. Unggah bukti transfer langsung dari panel langganan di bawah.`
                    : "Semua langganan, pembayaran, dan verifikasi ada di satu halaman. Tidak ada langkah yang perlu dicari."}
                </p>
              </div>

              <p className="text-[0.72rem] tracking-[0.16em] text-[#A8A29A] uppercase">
                {email} · sejak {formatDate(memberSince)}
              </p>
            </div>
          </Bezel>
          <Bezel className="h-full gap-4">
            <dl className="flex flex-col gap-2.5 text-[0.8rem] text-[#6F6A62]">
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="text-[#1C1917]">
                  {active ? STATUS_LABEL[active.status] : "Tanpa paket aktif"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Paket</dt>
                <dd className="text-[#1C1917]">{active?.plan.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Periode</dt>
                <dd className="text-right text-[#1C1917]">
                  {active
                    ? `${formatDate(active.startDate)} — ${formatDate(active.endDate)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Langganan</dt>
                <dd className="text-[#1C1917]">{subscriptions.length}</dd>
              </div>
              {isAdmin ? (
                <div className="flex justify-between gap-4">
                  <dt>Antrean verifikasi</dt>
                  <dd className="text-[#1C1917]">
                    {
                      payments.filter((payment) => payment.status === "PENDING")
                        .length
                    }
                  </dd>
                </div>
              ) : null}
            </dl>
          </Bezel>
        </section>
      ) : null}

      {view === "overview" ? (
        isAdmin ? (
          // PRD §19: the admin overview is a summary surface, not a work queue —
          // the queue itself lives in the verification panel.
          <section className="flex flex-col gap-6">
            <SectionHeading
              id="ringkasan-admin"
              eyebrow="Ringkasan"
              title="Kondisi platform"
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <StatCard
                label="Jumlah pengguna"
                value={workspace.stats?.userCount ?? 0}
                hint="Akun terdaftar di platform"
              />
              <StatCard
                label="Antrean verifikasi"
                value={workspace.stats?.pendingCount ?? 0}
                hint="Bukti transfer menunggu keputusan"
                accent={(workspace.stats?.pendingCount ?? 0) > 0}
              />
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-6">
              <SectionHeading
                id="langganan"
                eyebrow="Langganan"
                title="Paket yang Anda kelola"
                aside={
                  <p className="text-[0.74rem] text-[#8A8378]">
                    {subscriptions.length} langganan tercatat
                  </p>
                }
              />

              {subscriptions.length === 0 ? (
                <EmptyState>
                  Belum ada langganan. Pilih paket di katalog untuk memulai.
                </EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {subscriptions.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-6">
              <SectionHeading
                id="katalog"
                eyebrow="Katalog"
                title="Paket tersedia"
                aside={
                  <p className="text-[0.74rem] text-[#8A8378]">
                    {plans.length} paket aktif
                  </p>
                }
              />
              {plans.length === 0 ? (
                <EmptyState>Belum ada paket yang tersedia saat ini.</EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      subscriptionStatus={latestPerPlan[plan.id]?.status}
                      pending={pendingPlanId === plan.id}
                      onSelect={(selected) => startSubscription(selected.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )
      ) : null}

      {view === "payments" && !isAdmin ? (
        <>
          <section className="flex flex-col gap-6">
            <SectionHeading
              id="pembayaran"
              eyebrow="Pembayaran"
              title="Riwayat bukti transfer"
            />
            <HistoryList subscriptions={subscriptions} />
          </section>

          <section className="flex flex-col gap-6">
            <SectionHeading
              id="katalog"
              eyebrow="Katalog"
              title="Paket tersedia"
              aside={
                <p className="text-[0.74rem] text-[#8A8378]">
                  {plans.length} paket aktif
                </p>
              }
            />
            {plans.length === 0 ? (
              <EmptyState>Belum ada paket yang tersedia saat ini.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <PlanTile plan={plan} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {view === "verification" && isAdmin ? (
        <section className="flex flex-col gap-6">
          <SectionHeading
            id="verifikasi"
            eyebrow="Verifikasi"
            title="Antrean keputusan admin"
            aside={
              <p className="text-[0.74rem] text-[#8A8378]">
                {
                  payments.filter((payment) => payment.status === "PENDING")
                    .length
                }{" "}
                menunggu
              </p>
            }
          />
          <AdminQueue payments={payments} />
        </section>
      ) : null}

      {create.isError || renew.isError ? (
        <AuthNotice message="Aksi langganan gagal diproses. Coba lagi sebentar." />
      ) : null}

      {create.isPending || renew.isPending ? (
        <p className="flex items-center gap-3 text-[0.78rem] text-[#8A8378]">
          <Spinner className="size-3.5" />
          Memproses perubahan langganan…
        </p>
      ) : null}
    </div>
  );
}
