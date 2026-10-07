"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import type { WorkspaceView } from "@/features/subscription/subscription.type";
import type { Workspace } from "@/features/subscription/dal";
import { DashboardView } from "@/features/subscription/components/DashboardView";

/**
 * Owns the shell: the sidebar picks a panel and this component hands the choice
 * to the panel renderer, so neither the rail nor the content keeps its own copy
 * of the current view.
 */
export function DashboardShell({
  workspace,
  role,
}: {
  workspace: Workspace;
  role: string;
}) {
  const [view, setView] = useState<WorkspaceView>("overview");

  return (
    <div className="mx-auto flex w-full max-w-[88rem] flex-col px-4 pt-6 pb-16 sm:px-6 lg:flex-row lg:items-start lg:gap-10 lg:px-8">
      <AppSidebar
        email={workspace.email}
        role={role}
        isAdmin={workspace.isAdmin}
        view={view}
        onSelect={setView}
      />

      <main
        id="kandungan"
        className="flex min-w-0 flex-1 flex-col pt-6 lg:pt-0"
      >
        <DashboardView workspace={workspace} view={view} />
      </main>
    </div>
  );
}
