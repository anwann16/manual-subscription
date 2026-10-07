"use client";

import { CheckIcon, CopyIcon, MenuIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LogoutButton } from "@/components/logout-button";
import { navEntriesFor } from "@/features/subscription/helper/navigation";
import type { WorkspaceView } from "@/features/subscription/subscription.type";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  email: string;
  role: string;
  isAdmin: boolean;
  view: WorkspaceView;
  onSelect: (view: WorkspaceView) => void;
};

/** Shared row chrome for every sidebar destination: same box, same motion. */
const itemClassName =
  "group/nav flex w-full items-center justify-between gap-3 rounded-full px-4 py-3 text-left text-[0.8rem] transition-[background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Sidebar shell for the dashboard. The page is the only authenticated route and
 * each destination is a panel of it, so selection is lifted state rather than a
 * link — the sidebar reports the view and the dashboard renders it. Below `lg`
 * the same panel slides in as an overlay, so one component owns both.
 */
export function AppSidebar({
  email,
  role,
  isAdmin,
  view,
  onSelect,
}: AppSidebarProps) {
  const entries = navEntriesFor(isAdmin);

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyReset = useRef<number | null>(null);

  // The overlay covers the page, so the document behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function copyEmail() {
    navigator.clipboard
      .writeText(email)
      .then(() => {
        setCopied(true);
        toast.success("Email disalin");
        if (copyReset.current) window.clearTimeout(copyReset.current);
        // A clipboard confirmation is a moment, not a state: it resets itself.
        copyReset.current = window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => toast.error("Clipboard tidak tersedia di peramban ini."));
  }

  function select(next: WorkspaceView) {
    onSelect(next);
    setOpen(false);
  }

  const identity = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1C1917] font-heading text-[0.8rem] text-[#FBF9F5]">
        S
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-heading text-[0.88rem] tracking-tight">
          Subscription
        </span>
        <span className="text-[0.58rem] tracking-[0.22em] text-[#A8A29A] uppercase">
          Manual Payment
        </span>
      </span>
    </>
  );

  const navList = (onNavigate: (next: WorkspaceView) => void) => (
    <nav aria-label="Bagian dashboard" className="flex flex-col gap-1.5">
      {entries.map((entry) => {
        const active = entry.view === view;
        return (
          <button
            key={entry.view}
            type="button"
            onClick={() => onNavigate(entry.view)}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClassName,
              active
                ? "bg-[#1C1917] text-[#FBF9F5] shadow-[0_18px_36px_-26px_rgba(28,25,23,0.9)]"
                : "text-[#6F6A62] hover:bg-black/[0.04] hover:text-[#1C1917]",
            )}
          >
            {entry.label}
            <span
              aria-hidden
              className={cn(
                "font-mono text-[0.7rem] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "text-[#FBF9F5]"
                  : "text-[#B8B1A6] group-hover/nav:translate-x-1",
              )}
            >
              →
            </span>
          </button>
        );
      })}
    </nav>
  );

  const session = (
    <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[#FDFCFA] p-5 ring-1 ring-black/[0.05]">
      <span className="flex flex-col gap-1">
        <span className="text-[0.6rem] tracking-[0.18em] text-[#A8A29A] uppercase">
          Masuk sebagai
        </span>
        <button
          type="button"
          onClick={copyEmail}
          aria-label={`Salin email ${email}`}
          className="group/mail flex items-center justify-between gap-3 text-left text-[0.84rem] text-[#1C1917]"
        >
          <span className="truncate">{email}</span>
          <span className="relative size-4 shrink-0 text-[#A8A29A] transition-colors duration-500 group-hover/mail:text-[#1C1917]">
            {copied ? (
              <CheckIcon aria-hidden strokeWidth={1.25} className="size-4" />
            ) : (
              <CopyIcon aria-hidden strokeWidth={1.25} className="size-4" />
            )}
          </span>
        </button>
      </span>
      <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.58rem] tracking-[0.16em] uppercase",
            isAdmin
              ? "bg-[#F3EFE4] text-[#8A6D3B] ring-1 ring-[#B08D57]/20"
              : "bg-[#EDF1EC] text-[#4F6B52] ring-1 ring-[#8A9A8C]/25",
          )}
        >
          {role}
        </span>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <>
      {/* Compact bar: the sidebar is a drawer until there is room to park a rail. */}
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-full bg-[#F3EEE5]/80 p-1.5 ring-1 ring-black/[0.06] backdrop-blur-xl shadow-[0_28px_60px_-40px_rgba(28,25,23,0.45)]">
          <div className="flex min-w-0 items-center gap-2.5 rounded-full bg-[#FDFCFA]/80 py-1.5 pr-4 pl-3">
            {identity}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Buka menu"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FDFCFA]/80 ring-1 ring-black/[0.06] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.04]"
          >
            <MenuIcon aria-hidden strokeWidth={1.5} className="size-4" />
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col gap-6 bg-[#FBF9F5]/92 px-5 py-5 backdrop-blur-3xl lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
            aria-label="Tutup menu"
            tabIndex={-1}
          />

          <div className="relative flex items-center justify-between gap-3 rounded-full bg-[#FDFCFA]/70 p-1.5 pr-2 pl-4 ring-1 ring-black/[0.06]">
            {identity}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-black/[0.06]"
            >
              <XIcon aria-hidden strokeWidth={1.5} className="size-4" />
            </button>
          </div>

          <div className="relative mt-1 flex flex-col gap-1.5 [&>nav>button]:py-4 [&>nav>button]:text-[1.2rem] [&>nav>button]:font-heading [&>nav>button]:tracking-[-0.02em]">
            {navList(select)}
          </div>

          <div className="relative mt-auto">{session}</div>
        </div>
      ) : null}

      {/* Desktop rail: parked on the left, sticky for the whole scroll. */}
      <aside className="hidden lg:sticky lg:top-6 lg:z-40 lg:flex lg:h-[calc(100dvh-3rem)] lg:w-[17.5rem] lg:shrink-0 lg:flex-col lg:gap-6 lg:self-start">
        <div className="flex flex-col gap-6 rounded-[2rem] bg-[#EFEAE2]/70 p-1.5 ring-1 ring-black/[0.045] shadow-[0_40px_80px_-56px_rgba(28,25,23,0.45)]">
          <div className="flex items-center gap-2.5 rounded-[calc(2rem-0.375rem)] bg-[#FDFCFA] px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.7)]">
            {identity}
          </div>

          <div className="rounded-[calc(2rem-0.375rem)] bg-[#FDFCFA] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(255,255,255,0.7)]">
            {navList(select)}
          </div>
        </div>

        <div className="mt-auto">{session}</div>
      </aside>
    </>
  );
}
