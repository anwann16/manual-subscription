"use client";

import { useFormStatus } from "react-dom";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AuthSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="group/cta h-12 w-full rounded-full bg-[#1C1917] pr-1.5 pl-6 text-[0.68rem] font-semibold text-[#FBF9F5] tracking-[0.18em] shadow-[0_20px_36px_-20px_rgba(28,25,23,0.65)] transition-[background-color,transform,box-shadow] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2B2622] focus-visible:ring-2 focus-visible:ring-[#1C1917]/25 active:not-aria-[haspopup]:translate-y-0 active:scale-[0.98] disabled:opacity-70"
    >
      <span>{pending ? "Memproses…" : label}</span>
      <span
        data-icon="inline-end"
        className="ml-auto grid size-9 place-items-center rounded-full bg-white/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-1 group-hover/cta:-translate-y-[1px] group-hover/cta:scale-105"
      >
        {pending ? (
          <Spinner className="size-4" />
        ) : (
          <ArrowUpRightIcon strokeWidth={1.25} className="size-4" />
        )}
      </span>
    </Button>
  );
}
