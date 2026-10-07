import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-[2rem] bg-[#EAE4DA]/60 p-1.5 ring-1 ring-black/[0.045] shadow-[0_48px_90px_-48px_rgba(28,25,23,0.32)]",
        className,
      )}
    >
      <div className="flex flex-col gap-7 rounded-[calc(2rem-0.375rem)] bg-[#FDFCFA] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.7)] sm:p-8">
        <header className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-[#F1ECE4] px-3 py-1 ring-1 ring-black/[0.05]">
            <Badge
              variant="secondary"
              className="text-[0.58rem] text-[#8A8378] tracking-[0.22em]"
            >
              {eyebrow}
            </Badge>
          </span>
          <h2 className="font-heading text-[1.75rem] leading-tight tracking-[-0.02em]">
            {title}
          </h2>
          <p className="text-[0.84rem] leading-relaxed text-[#6F6A62]">
            {description}
          </p>
        </header>

        {children}

        <footer className="border-t border-black/[0.06] pt-5 text-[0.8rem] text-[#6F6A62]">
          {footer}
        </footer>
      </div>
    </div>
  );
}
