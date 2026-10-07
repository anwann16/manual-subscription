import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SubscriptionStatus } from "@/generated/prisma/enums";
import { formatDuration, formatRupiah } from "../helper/format";
import type { PlanDTO } from "../subscription.type";
import { SubscriptionStatusBadge } from "./StatusBadge";

type PlanCardProps = {
  plan: PlanDTO;
  /** Status of the user's existing subscription for this plan, if any. */
  subscriptionStatus?: SubscriptionStatus;
  pending?: boolean;
  onSelect: (plan: PlanDTO) => void;
};

/** PRD §8: the card only ever sends `planId`; price/duration are display-only. */
export function PlanCard({
  plan,
  subscriptionStatus,
  pending,
  onSelect,
}: PlanCardProps) {
  return (
    <article className="group/plan flex flex-col gap-6 rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05] transition-shadow duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_36px_70px_-46px_rgba(28,25,23,0.4)]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-[1.05rem]">{plan.name}</h3>
          <p className="text-[0.82rem] leading-relaxed text-[#6F6A62]">
            {plan.description}
          </p>
        </div>
        {subscriptionStatus ? (
          <SubscriptionStatusBadge status={subscriptionStatus} />
        ) : null}
      </header>

      <div className="flex flex-col gap-1">
        <span className="font-heading text-[2rem] leading-none tracking-[-0.03em]">
          {formatRupiah(plan.price)}
        </span>
        <span className="text-[0.72rem] tracking-[0.14em] text-[#8A8378] uppercase">
          per {formatDuration(plan.duration, plan.durationUnit)}
        </span>
      </div>

      <div className="mt-auto">
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={() => onSelect(plan)}
          className="h-11 w-full rounded-full pr-1.5 pl-6 text-[0.66rem] tracking-[0.18em]"
        >
          <span>{subscriptionStatus ? "Lihat langganan" : "Pilih paket"}</span>
          <span
            data-icon="inline-end"
            className="ml-auto grid size-8 place-items-center rounded-full bg-white/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/plan:translate-x-1 group-hover/plan:-translate-y-[1px] group-hover/plan:scale-105"
          >
            {pending ? (
              <Spinner className="size-4" />
            ) : (
              <ArrowUpRightIcon strokeWidth={1.25} className="size-4" />
            )}
          </span>
        </Button>
      </div>
    </article>
  );
}
