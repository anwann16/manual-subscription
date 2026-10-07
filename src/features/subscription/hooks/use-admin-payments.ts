"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/axios";

import type { PaymentStatus } from "@/generated/prisma/enums";
import type { AdminPaymentDTO } from "../subscription.type";
import { apiErrorMessage } from "./api-error";
import { adminPaymentKeys } from "./query-keys";

export function useAdminPayments(status?: PaymentStatus) {
  return useQuery({
    queryKey: adminPaymentKeys.list(status),
    queryFn: async () => {
      const { data } = await api.get<{ payments: AdminPaymentDTO[] }>(
        "/admin/payments",
        { params: status ? { status } : undefined },
      );
      return data.payments;
    },
  });
}

/** PRD §11/§12: the server computes the period and commits everything at once. */
export function useApprovePayment() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post<{ payment: AdminPaymentDTO }>(
        `/admin/payments/${paymentId}/approve`,
      );
      return data.payment;
    },
    onSuccess: (payment) => {
      // Queue and status are rendered from the server read; the refresh repaints
      // them, the invalidation only keeps API consumers consistent.
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.refresh();
      toast.success("Pembayaran disetujui", {
        description: `Langganan ${payment.subscription.user.email} kini aktif.`,
      });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      paymentId,
      rejectionReason,
    }: {
      paymentId: string;
      rejectionReason?: string;
    }) => {
      const { data } = await api.post<{ payment: AdminPaymentDTO }>(
        `/admin/payments/${paymentId}/reject`,
        { rejectionReason },
      );
      return data.payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      router.refresh();
      toast.success("Pembayaran ditolak");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
}
