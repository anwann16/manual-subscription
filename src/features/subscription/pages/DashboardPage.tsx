import { DashboardShell } from "@/features/subscription/components/DashboardShell";
import { getWorkspace } from "@/features/subscription/dal";
import { requireUser } from "@/features/auth/dal";

/**
 * PRD §17/§18: the only authenticated route. The session is resolved on the
 * server (unauthenticated visitors are redirected to `/login`), and every list the
 * page renders comes from that same session-scoped read — plans, subscriptions,
 * payments, and the verification queue for admins.
 */
async function DashboardPage() {
  const user = await requireUser();
  const workspace = await getWorkspace({ id: user.id, role: user.role });

  return (
    <div className="relative isolate min-h-dvh w-full bg-[#FBF9F5] text-[#1C1917]">
      <div aria-hidden className="auth-mesh pointer-events-none fixed inset-0 -z-10" />
      <div
        aria-hidden
        className="auth-grain pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-multiply"
      />

      <a
        href="#kandungan"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-full focus:bg-[#1C1917] focus:px-5 focus:py-2.5 focus:text-[0.72rem] focus:tracking-[0.18em] focus:text-[#FBF9F5] focus:uppercase"
      >
        Lewati ke konten
      </a>

      <DashboardShell workspace={workspace} role={user.role} />
    </div>
  );
}

export default DashboardPage;
