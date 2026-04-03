"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupportTickets,
  getSupportTicket,
  getSupportStats,
  replySupportTicket,
  assignSupportTicket,
  updateSupportTicketStatus,
} from "@/lib/api";
import { toast } from "sonner";

// ============================================================================
// Query Keys
// ============================================================================

export const supportKeys = {
  all: ["support"] as const,
  lists: () => [...supportKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...supportKeys.lists(), params] as const,
  details: () => [...supportKeys.all, "detail"] as const,
  detail: (id: string) => [...supportKeys.details(), id] as const,
  stats: () => [...supportKeys.all, "stats"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseSupportTicketsParams {
  status?: string;
  category?: string;
  assignedTo?: string;
  q?: string;
  offset?: number;
  limit?: number;
}

/** Fetch paginated support ticket list with filters. */
export function useSupportTickets(params: UseSupportTicketsParams = {}) {
  return useQuery({
    queryKey: supportKeys.list(params as Record<string, unknown>),
    queryFn: () => getSupportTickets(params),
    staleTime: 15_000,
  });
}

/** Fetch a single support ticket by ID with messages. */
export function useSupportTicket(id: string | undefined) {
  return useQuery({
    queryKey: supportKeys.detail(id!),
    queryFn: () => getSupportTicket(id!),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

/** Fetch aggregate support stats. */
export function useSupportStats() {
  return useQuery({
    queryKey: supportKeys.stats(),
    queryFn: getSupportStats,
    staleTime: 30_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/** Reply to a support ticket. Invalidates detail + list. */
export function useReplySupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
      replySupportTicket(ticketId, body),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
      toast.success("Reply sent");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reply");
    },
  });
}

/** Assign a support ticket to an agent. */
export function useAssignSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, agentId }: { ticketId: string; agentId: string }) =>
      assignSupportTicket(ticketId, agentId),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportKeys.stats() });
      toast.success("Ticket assigned");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign ticket");
    },
  });
}

/** Update the status of a support ticket. */
export function useUpdateSupportTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      updateSupportTicketStatus(ticketId, status),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportKeys.stats() });
      toast.success("Status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}
