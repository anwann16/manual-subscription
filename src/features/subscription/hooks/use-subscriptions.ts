"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/axios";
import type { SubscriptionDTO } from "../subscription.type";
import { apiErrorMessage } from "./api-error";
import { subscriptionKeys } from "./query-keys";

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionKeys.all,
    queryFn: async () => {
      const { data } = await api.get<{ subscriptions: SubscriptionDTO[] }>(
        "/subscriptions",
      );
      return data.subscriptions;
    },
  });
}

/** Pass `null` while the id is still unknown (route param not resolved). */
export function useSubscription(id: string | null) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ subscription: SubscriptionDTO }>(
        `/subscriptions/${id}`,
      );
      return data.subscription;
    },
  });
}

/** PRD §8: only `planId` crosses the wire; price and duration are backend data. */
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post<{ subscription: SubscriptionDTO }>(
        "/subscriptions",
        { planId },
      );
      return data.subscription;
    },
    onSuccess: (subscription) => {
      // The dashboard renders from the server read, not from this cache, so the
      // router refresh is what actually repaints it; the invalidation only keeps
      // the JSON API consumers in sync.
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      router.refresh();
      toast.success("Pengajuan langganan dibuat", {
        description: `Paket ${subscription.plan.name} menunggu pembayaran.`,
      });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}
