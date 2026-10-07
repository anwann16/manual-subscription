import type { WorkspaceView } from "../subscription.type";

export type NavEntry = {
  view: WorkspaceView;
  label: string;
  owner: "all" | "user" | "admin";
};

/**
 * Views of the single authenticated page. Switching one only swaps the rendered
 * panel, so the sidebar and the dashboard share this list instead of describing
 * the same three panels twice.
 */
export const NAV_ENTRIES: readonly NavEntry[] = [
  { view: "overview", label: "Ringkasan", owner: "all" },
  { view: "payments", label: "Pembayaran", owner: "user" },
  { view: "verification", label: "Verifikasi", owner: "admin" },
];

export function navEntriesFor(isAdmin: boolean): NavEntry[] {
  return NAV_ENTRIES.filter(
    (entry) =>
      entry.owner === "all" || (isAdmin ? "admin" : "user") === entry.owner,
  );
}
