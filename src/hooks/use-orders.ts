"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getOrders,
  getOrder,
  cancelOrder,
  fulfillOrder,
  shipOrder,
  completeOrder,
  getDraftOrders,
  type OrdersResponse,
  type Order,
  type FulfillOrderResponse,
  type ShipOrderResponse,
  type ShipOrderRequest,
  type CompleteOrderResponse,
} from "@/lib/api";

// ─── Query keys ────────────────────────────────────────────

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ─── List hook ─────────────────────────────────────────────

export interface UseOrdersParams {
  limit?: number;
  offset?: number;
  q?: string;
  payment_status?: string;
  fulfillment_status?: string;
  created_after?: string;
  created_before?: string;
}

export function useOrders(params: UseOrdersParams = {}) {
  return useQuery<OrdersResponse>({
    queryKey: orderKeys.list(params as Record<string, unknown>),
    queryFn: () => getOrders(params),
    staleTime: 30_000, // 30 seconds
    placeholderData: keepPreviousData, // keep previous page visible during pagination
  });
}

// ─── Detail hook ───────────────────────────────────────────

export function useOrder(id: string, enabled = true) {
  return useQuery<Order>({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id),
    staleTime: 15_000,
    enabled: !!id && enabled,
  });
}

// ─── Mutations ─────────────────────────────────────────────

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { id: string; canceledBy?: string; reason?: string }
  >({
    mutationFn: ({ id, ...data }) => cancelOrder(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.id),
      });
    },
  });
}

export function useFulfillOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    FulfillOrderResponse,
    Error,
    { id: string; fulfilledBy?: string }
  >({
    mutationFn: ({ id, ...data }) => fulfillOrder(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Update the cache with the fresh order returned by the API
      queryClient.setQueryData(orderKeys.detail(variables.id), data.order);
    },
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    ShipOrderResponse,
    Error,
    { id: string } & ShipOrderRequest
  >({
    mutationFn: ({ id, ...data }) => shipOrder(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(variables.id), data.order);
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation<CompleteOrderResponse, Error, { id: string }>({
    mutationFn: ({ id }) => completeOrder(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(variables.id), data.order);
    },
  });
}

// ─── Draft Orders ───────────────────────────────────────────

export const draftOrderKeys = {
  all: ["draft-orders"] as const,
  lists: () => [...draftOrderKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...draftOrderKeys.lists(), params] as const,
};

export function useDraftOrders(params: { limit?: number; offset?: number } = {}) {
  return useQuery<OrdersResponse>({
    queryKey: draftOrderKeys.list(params as Record<string, unknown>),
    queryFn: () => getDraftOrders(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
