"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCampaigns,
  type CampaignsResponse,
} from "@/lib/api";

export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...campaignKeys.lists(), params] as const,
};

/**
 * Hook for fetching paginated campaigns with filters
 */
export function useCampaigns(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
}) {
  return useQuery<CampaignsResponse>({
    queryKey: campaignKeys.list(params ?? {}),
    queryFn: () => getCampaigns(params),
    staleTime: 10_000,
  });
}
