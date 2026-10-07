"use client";

import { useQueryClient } from "@tanstack/react-query";

import { logout } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";

/**
 * The QueryClient lives in the root provider and survives client-side
 * navigation, so signing out must drop the cached subscriptions/payments of the
 * previous user — otherwise the next session renders the old user's data until
 * `staleTime` lapses. The submit handler runs before the server action.
 */
export function LogoutButton() {
  const queryClient = useQueryClient();

  return (
    <form action={logout} onSubmit={() => queryClient.clear()}>
      <Button type="submit" variant="outline" size="sm">
        Keluar
      </Button>
    </form>
  );
}
