"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDiscounts,
  getDiscountStats,
  getDiscountActivity,
  activateDiscount,
  deactivateDiscount,
  deleteDiscount,
  duplicateDiscount,
  bulkDiscountAction,
  type PromotionsListResponse,
  type DiscountStatsResponse,
  type DiscountActivityResponse,
  type PromotionResponse,
  type BulkDiscountRequest,
  type BulkDiscountResult,
} from "@/lib/api";

export const discountKeys = {
  all: ["discounts"] as const,
  list: (params?: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: string;
    type?: string;
  }) => ["discounts", "list", params] as const,
  stats: () => ["discounts", "stats"] as const,
  activity: (params?: { limit?: number }) =>
    ["discounts", "activity", params] as const,
};

/**
 * Hook for fetching paginated discount list with filters
 */
export function useDiscounts(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
  type?: string;
}) {
  return useQuery<PromotionsListResponse>({
    queryKey: discountKeys.list(params),
    queryFn: () => getDiscounts(params),
    staleTime: 10000,
  });
}

/**
 * Hook for fetching discount stats
 */
export function useDiscountStats() {
  return useQuery<DiscountStatsResponse>({
    queryKey: discountKeys.stats(),
    queryFn: getDiscountStats,
    staleTime: 15000,
  });
}

/**
 * Hook for fetching discount activity feed
 */
export function useDiscountActivity(params?: { limit?: number }) {
  return useQuery<DiscountActivityResponse>({
    queryKey: discountKeys.activity(params),
    queryFn: () => getDiscountActivity(params),
    staleTime: 15000,
  });
}

/**
 * Mutation hook for activating a discount
 */
export function useActivateDiscount() {
  const queryClient = useQueryClient();

  return useMutation<PromotionResponse, Error, string>({
    mutationFn: activateDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

/**
 * Mutation hook for deactivating a discount
 */
export function useDeactivateDiscount() {
  const queryClient = useQueryClient();

  return useMutation<PromotionResponse, Error, string>({
    mutationFn: deactivateDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

/**
 * Mutation hook for deleting a discount
 */
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; id: string }, Error, string>({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

/**
 * Mutation hook for duplicating a discount
 */
export function useDuplicateDiscount() {
  const queryClient = useQueryClient();

  return useMutation<PromotionResponse, Error, string>({
    mutationFn: duplicateDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

/**
 * Mutation hook for bulk discount actions (activate, deactivate, delete)
 */
export function useBulkDiscountAction() {
  const queryClient = useQueryClient();

  return useMutation<BulkDiscountResult, Error, BulkDiscountRequest>({
    mutationFn: bulkDiscountAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}
