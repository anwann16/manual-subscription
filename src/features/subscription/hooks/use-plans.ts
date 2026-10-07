"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import type { PlanDTO } from "../subscription.type";
import { planKeys } from "./query-keys";

/** PRD §17: `/plans` reads the catalogue through the API, never from props. */
export function usePlans() {
  return useQuery({
    queryKey: planKeys.all,
    queryFn: async () => {
      const { data } = await api.get<{ plans: PlanDTO[] }>("/plans");
      return data.plans;
    },
  });
}
