"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPricingWorkbench,
  getPricingRules,
  getPriceHistory,
  bulkUpdatePrices,
  activatePricingRule,
  deactivatePricingRule,
  deletePricingRule,
  type WorkbenchResponse,
  type PricingRulesResponse,
  type PriceHistoryResponse,
  type BulkPriceUpdateRequest,
  type BulkPriceUpdateResult,
  type PricingRuleResponse,
} from "@/lib/api";

export const pricingKeys = {
  all: ["pricing"] as const,
  workbench: (params?: Record<string, unknown>) =>
    ["pricing", "workbench", params] as const,
  rules: (params?: Record<string, unknown>) =>
    ["pricing", "rules", params] as const,
  history: (params?: Record<string, unknown>) =>
    ["pricing", "history", params] as const,
};

/**
 * Hook for fetching the pricing workbench (product variants + stats)
 */
export function usePricingWorkbench(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  categoryId?: string;
  hasDiscount?: boolean;
}) {
  return useQuery<WorkbenchResponse>({
    queryKey: pricingKeys.workbench(params as Record<string, unknown>),
    queryFn: () => getPricingWorkbench(params),
    staleTime: 10_000,
  });
}

/**
 * Hook for fetching pricing rules
 */
export function usePricingRules(params?: {
  status?: string;
  type?: string;
}) {
  return useQuery<PricingRulesResponse>({
    queryKey: pricingKeys.rules(params as Record<string, unknown>),
    queryFn: () => getPricingRules(params),
    staleTime: 15_000,
  });
}

/**
 * Hook for fetching price change history
 */
export function usePriceHistory(params?: {
  limit?: number;
  offset?: number;
  variantId?: string;
  changeType?: string;
}) {
  return useQuery<PriceHistoryResponse>({
    queryKey: pricingKeys.history(params as Record<string, unknown>),
    queryFn: () => getPriceHistory(params),
    staleTime: 15_000,
  });
}

/**
 * Mutation hook for bulk updating prices
 */
export function useBulkUpdatePrices() {
  const queryClient = useQueryClient();

  return useMutation<BulkPriceUpdateResult, Error, BulkPriceUpdateRequest>({
    mutationFn: bulkUpdatePrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}

/**
 * Mutation hook for activating a pricing rule
 */
export function useActivatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<PricingRuleResponse, Error, string>({
    mutationFn: activatePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}

/**
 * Mutation hook for deactivating a pricing rule
 */
export function useDeactivatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<PricingRuleResponse, Error, string>({
    mutationFn: deactivatePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}

/**
 * Mutation hook for deleting a pricing rule
 */
export function useDeletePricingRule() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; id: string }, Error, string>({
    mutationFn: deletePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}
