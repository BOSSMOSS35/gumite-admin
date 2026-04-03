"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomers,
  getCustomer,
  getCustomerStats,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getCustomerActivity,
  sendCustomerEmail,
  sendGiftCard,
  changeCustomerTier,
  suspendCustomer,
  activateCustomer,
  restoreCustomer,
  resetCustomerPassword,
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  addCustomerToGroup,
  removeCustomerFromGroup,
  type CustomerTier,
  type CustomerStatus,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type SendEmailRequest,
  type SendGiftCardRequest,
  type ChangeTierRequest,
  type SuspendCustomerRequest,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  stats: () => [...customerKeys.all, "stats"] as const,
  orders: (id: string) => [...customerKeys.all, "orders", id] as const,
  activity: (id: string) => [...customerKeys.all, "activity", id] as const,
  groups: () => [...customerKeys.all, "groups"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseCustomersParams {
  limit?: number;
  offset?: number;
  q?: string;
  tier?: CustomerTier;
  status?: CustomerStatus;
  groupId?: string;
}

/**
 * Fetch paginated customer list with filters.
 * Debouncing of the search query should happen in the UI layer
 * (e.g. via the Zustand store) before passing `q` here.
 */
export function useCustomers(params: UseCustomersParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params as Record<string, unknown>),
    queryFn: () => getCustomers(params),
    staleTime: 15_000, // 15 seconds
  });
}

/** Fetch a single customer by ID. */
export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id!),
    queryFn: () => getCustomer(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Fetch aggregate customer stats. */
export function useCustomerStats() {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: getCustomerStats,
    staleTime: 30_000,
  });
}

/** Fetch a customer's orders. */
export function useCustomerOrders(
  customerId: string | undefined,
  params?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: [...customerKeys.orders(customerId!), params],
    queryFn: () => getCustomerOrders(customerId!, params),
    enabled: !!customerId,
    staleTime: 15_000,
  });
}

/** Fetch a customer's activity feed. */
export function useCustomerActivity(
  customerId: string | undefined,
  params?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: [...customerKeys.activity(customerId!), params],
    queryFn: () => getCustomerActivity(customerId!, params),
    enabled: !!customerId,
    staleTime: 15_000,
  });
}

/** Fetch customer groups. */
export function useCustomerGroups(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: [...customerKeys.groups(), params],
    queryFn: () => getCustomerGroups(params),
    staleTime: 60_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/** Create a new customer. Invalidates list + stats. */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Update an existing customer. Invalidates detail + list. */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      updateCustomer(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

/** Delete a customer. Invalidates list + stats. */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Send an email to a customer. Invalidates activity. */
export function useSendCustomerEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: SendEmailRequest;
    }) => sendCustomerEmail(customerId, data),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.activity(customerId),
      });
    },
  });
}

/** Send a gift card to a customer. Invalidates activity. */
export function useSendGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: SendGiftCardRequest;
    }) => sendGiftCard(customerId, data),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.activity(customerId),
      });
    },
  });
}

/** Change a customer's tier. Invalidates detail + list + stats. */
export function useChangeCustomerTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: ChangeTierRequest;
    }) => changeCustomerTier(customerId, data),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Suspend a customer account. Invalidates detail + list + stats. */
export function useSuspendCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: SuspendCustomerRequest;
    }) => suspendCustomer(customerId, data),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Activate a suspended customer. Invalidates detail + list + stats. */
export function useActivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => activateCustomer(customerId),
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Restore a soft-deleted customer. Invalidates detail + list + stats. */
export function useRestoreCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => restoreCustomer(customerId),
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
  });
}

/** Reset a customer's password. */
export function useResetCustomerPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => resetCustomerPassword(customerId),
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.activity(customerId),
      });
    },
  });
}

/** Create a customer group. */
export function useCreateCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createCustomerGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/** Update a customer group. */
export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: { name?: string; description?: string };
    }) => updateCustomerGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/** Delete a customer group. */
export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => deleteCustomerGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/** Add a customer to a group. Invalidates detail + groups. */
export function useAddCustomerToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      groupId,
    }: {
      customerId: string;
      groupId: string;
    }) => addCustomerToGroup(customerId, groupId),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}

/** Remove a customer from a group. Invalidates detail + groups. */
export function useRemoveCustomerFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      groupId,
    }: {
      customerId: string;
      groupId: string;
    }) => removeCustomerFromGroup(customerId, groupId),
    onSuccess: (_data, { customerId }) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(customerId),
      });
      queryClient.invalidateQueries({ queryKey: customerKeys.groups() });
    },
  });
}
