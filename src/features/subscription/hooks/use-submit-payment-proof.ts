"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/axios";
import type { SubscriptionDTO } from "../subscription.type";
import { apiErrorMessage } from "./api-error";
import { subscriptionKeys } from "./query-keys";

/**
 * PRD §9/§10: sent as multipart. The `api` instance defaults to
 * `application/json`, and axios' transformRequest would stringify a FormData
 * body under a JSON content type — declaring multipart here keeps the FormData
 * intact, and axios then clears the header so the browser sets the boundary.
 */
export function useSubmitPaymentProof(subscriptionId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("proof", file);

      const { data } = await api.post<{ subscription: SubscriptionDTO }>(
        `/subscriptions/${subscriptionId}/payments`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      router.refresh();
      toast.success("Bukti transfer terkirim", {
        description: "Menunggu verifikasi admin.",
      });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}
