"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReturns,
  getReturn,
  getReturnStats,
  approveReturn,
  receiveReturn,
  processReturnRefund,
  rejectReturn,
  type ReturnsResponse,
  type Return,
  type ReturnStats,
} from "@/lib/api";

// ============================================================================
// React Query Keys
// ============================================================================

export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (params: { limit: number; offset: number; status?: string; q?: string }) =>
    [...returnKeys.lists(), params] as const,
  stats: () => [...returnKeys.all, "stats"] as const,
  details: () => [...returnKeys.all, "detail"] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching paginated returns list with optional filters
 */
export function useReturns(params: {
  limit: number;
  offset: number;
  status?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => getReturns(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching return stats
 */
export function useReturnStats() {
  return useQuery({
    queryKey: returnKeys.stats(),
    queryFn: () => getReturnStats(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for fetching a single return by ID
 */
export function useReturn(id: string) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: async () => {
      const data = await getReturn(id);
      return data.returnRequest;
    },
    enabled: !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for approving a return
 */
export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => approveReturn(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

/**
 * Hook for marking a return as received
 */
export function useReceiveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { receivedBy?: string; notes?: string; restock?: boolean } }) =>
      receiveReturn(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

/**
 * Hook for processing a return refund
 */
export function useProcessReturnRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { processedBy?: string } }) =>
      processReturnRefund(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}

/**
 * Hook for rejecting a return
 */
export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string; rejectedBy?: string } }) =>
      rejectReturn(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.stats() });
    },
  });
}
