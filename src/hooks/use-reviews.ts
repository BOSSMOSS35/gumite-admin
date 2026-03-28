"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingReviews,
  getFlaggedReviews,
  getAdminReview,
  moderateReview,
  addAdminResponse,
  setReviewFeatured,
  deleteAdminReview,
  type AdminReview,
  type AdminReviewsResponse,
} from "@/lib/api";

// ============================================================================
// React Query Keys
// ============================================================================

export const reviewKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  pending: (params: { page: number; size: number }) =>
    [...reviewKeys.lists(), "pending", params] as const,
  flagged: (params: { page: number; size: number }) =>
    [...reviewKeys.lists(), "flagged", params] as const,
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching pending reviews
 */
export function usePendingReviews(params: { page: number; size: number }) {
  return useQuery({
    queryKey: reviewKeys.pending(params),
    queryFn: () => getPendingReviews(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching flagged reviews
 */
export function useFlaggedReviews(params: { page: number; size: number }) {
  return useQuery({
    queryKey: reviewKeys.flagged(params),
    queryFn: () => getFlaggedReviews(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching a single review by ID
 */
export function useAdminReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: async () => {
      const data = await getAdminReview(id);
      return data.review;
    },
    enabled: !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for moderating a review (approve/reject)
 */
export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { approved: boolean; note?: string } }) =>
      moderateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}

/**
 * Hook for adding an admin response to a review
 */
export function useAddAdminResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      addAdminResponse(id, response),
    onSuccess: (data) => {
      queryClient.setQueryData(reviewKeys.detail(data.review.id), data.review);
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}

/**
 * Hook for toggling featured status on a review
 */
export function useSetReviewFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      setReviewFeatured(id, featured),
    onSuccess: (data) => {
      queryClient.setQueryData(reviewKeys.detail(data.review.id), data.review);
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      deleteAdminReview(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}
