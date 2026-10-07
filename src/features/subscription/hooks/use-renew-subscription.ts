"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/axios";
import type { SubscriptionDTO } from "../subscription.type";
import { apiErrorMessage } from "./api-error";
import { subscriptionKeys } from "./query-keys";

/** PRD §14: renewal reopens the subscription for a fresh payment. */
export function useRenewSubscription() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data } = await api.post<{ subscription: SubscriptionDTO }>(
        `/subscriptions/${subscriptionId}/renew`,
      );
      return data.subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      router.refresh();
      toast.success("Perpanjangan diajukan", {
        description: "Unggah bukti transfer untuk melanjutkan.",
      });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}
