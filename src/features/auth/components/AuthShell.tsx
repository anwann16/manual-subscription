import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export type AuthStep = {
  label: string;
  detail: string;
};

type AuthShellProps = {
  eyebrow: string;
  headline: ReactNode;
  blurb: string;
  steps: AuthStep[];
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  headline,
  blurb,
  steps,
  children,
}: AuthShellProps) {
  return (
    <div className="relative isolate min-h-dvh w-full overflow-hidden bg-[#FBF9F5] text-[#1C1917]">
      <div
        aria-hidden
        className="auth-mesh pointer-events-none fixed inset-0 -z-10"
      />
      <div
        aria-hidden
        className="auth-grain pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-multiply"
      />

      <div className="relative mx-auto grid w-full max-w-368 grid-cols-1 gap-14 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-center lg:gap-20 lg:px-16 lg:py-24">
        <section className="auth-rise flex w-full flex-col gap-9">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#1C1917] font-heading text-[0.8rem] text-[#FBF9F5]">
              S
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-[0.95rem] tracking-tight">
                Subscription
              </span>
              <span className="text-[0.6rem] text-[#A8A29A] uppercase tracking-[0.22em]">
                Manual Payment
              </span>
            </span>
          </div>

          <span className="w-fit rounded-full bg-[#EFEAE2]/70 px-3 py-1 ring-1 ring-black/[0.06]">
            <Badge
              variant="secondary"
              className="text-[0.6rem] text-[#8A8378] tracking-[0.24em]"
            >
              {eyebrow}
            </Badge>
          </span>

          <h1 className="font-heading text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.98] tracking-[-0.025em] text-balance">
            {headline}
          </h1>

          <p className="max-w-md text-[0.9rem] leading-relaxed text-[#6F6A62]">
            {blurb}
          </p>

          <ol className="flex w-full max-w-lg flex-col">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className="auth-rise flex gap-6 border-t border-black/[0.07] py-5"
                style={{ animationDelay: `${280 + index * 90}ms` }}
              >
                <span className="pt-0.5 font-mono text-[0.65rem] text-[#B8B1A6] tracking-[0.18em]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[0.82rem] font-medium">
                    {step.label}
                  </span>
                  <span className="text-[0.78rem] leading-relaxed text-[#8A8378]">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="auth-rise flex w-full justify-center lg:justify-end"
          style={{ animationDelay: "160ms" }}
        >
          {children}
        </section>
      </div>
    </div>
  );
}
