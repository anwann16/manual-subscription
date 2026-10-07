import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BezelProps = {
  children: ReactNode;
  className?: string;
  /**
   * `tray` for interactive or stacked surfaces that should read as a plate set
   * into the page; `plate` for container panels that only need the hairline core.
   */
  variant?: "tray" | "plate";
};

/**
 * Double-bezel enclosure: a machined outer shell holding a lighter inner core,
 * with concentric radii so the two curves stay parallel. Every card, form, and
 * sheet on the dashboard is built from this instead of a flat bordered box.
 */
export function Bezel({ children, className, variant = "plate" }: BezelProps) {
  return (
    <div
      className={cn(
        variant === "tray" &&
          "rounded-[2rem] bg-[#EFEAE2]/70 p-1.5 ring-1 ring-black/[0.045] shadow-[0_40px_80px_-56px_rgba(28,25,23,0.45)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          variant === "tray"
            ? "rounded-[calc(2rem-0.375rem)] bg-[#FDFCFA] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.7)]"
            : "rounded-[1.75rem] bg-[#FDFCFA] p-6 ring-1 ring-black/[0.05]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
