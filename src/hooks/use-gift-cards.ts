"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGiftCards,
  getGiftCardStats,
  createGiftCard,
  updateGiftCard,
  disableGiftCard,
  enableGiftCard,
  deleteGiftCard,
  bulkGiftCardAction,
  adjustGiftCardBalance,
  type GiftCardsResponse,
  type GiftCardStatsResponse,
  type GiftCardResponse,
  type CreateGiftCardRequest,
  type UpdateGiftCardRequest,
  type AdjustBalanceRequest,
  type BulkGiftCardRequest,
  type BulkGiftCardResult,
  type GiftCardStatus,
} from "@/lib/api";

export const giftCardKeys = {
  all: ["gift-cards"] as const,
  list: (params?: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: GiftCardStatus;
  }) => ["gift-cards", "list", params] as const,
  stats: () => ["gift-cards", "stats"] as const,
};

/**
 * Hook for fetching paginated gift card list with filters
 */
export function useGiftCards(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: GiftCardStatus;
}) {
  return useQuery<GiftCardsResponse>({
    queryKey: giftCardKeys.list(params),
    queryFn: () => getGiftCards(params),
    staleTime: 10000,
  });
}

/**
 * Hook for fetching gift card stats
 */
export function useGiftCardStats() {
  return useQuery<GiftCardStatsResponse>({
    queryKey: giftCardKeys.stats(),
    queryFn: getGiftCardStats,
    staleTime: 15000,
  });
}

/**
 * Mutation hook for creating a gift card
 */
export function useCreateGiftCard() {
  const queryClient = useQueryClient();

  return useMutation<GiftCardResponse, Error, CreateGiftCardRequest>({
    mutationFn: createGiftCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for updating a gift card
 */
export function useUpdateGiftCard() {
  const queryClient = useQueryClient();

  return useMutation<
    GiftCardResponse,
    Error,
    { id: string; data: UpdateGiftCardRequest }
  >({
    mutationFn: ({ id, data }) => updateGiftCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for adjusting gift card balance
 */
export function useAdjustGiftCardBalance() {
  const queryClient = useQueryClient();

  return useMutation<
    GiftCardResponse,
    Error,
    { id: string; data: AdjustBalanceRequest }
  >({
    mutationFn: ({ id, data }) => adjustGiftCardBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for disabling a gift card
 */
export function useDisableGiftCard() {
  const queryClient = useQueryClient();

  return useMutation<GiftCardResponse, Error, string>({
    mutationFn: disableGiftCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for enabling a gift card
 */
export function useEnableGiftCard() {
  const queryClient = useQueryClient();

  return useMutation<GiftCardResponse, Error, string>({
    mutationFn: enableGiftCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for deleting a gift card
 */
export function useDeleteGiftCard() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; id: string }, Error, string>({
    mutationFn: deleteGiftCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}

/**
 * Mutation hook for bulk gift card actions (disable, enable, delete)
 */
export function useBulkGiftCardAction() {
  const queryClient = useQueryClient();

  return useMutation<BulkGiftCardResult, Error, BulkGiftCardRequest>({
    mutationFn: bulkGiftCardAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    },
  });
}
