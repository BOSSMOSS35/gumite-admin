"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventoryLevels,
  getStockLocations,
  adjustInventory,
  getInventoryMovements,
  type InventoryLevelsResponse,
  type StockLocationsResponse,
  type AdjustInventoryRequest,
  type AdjustInventoryResponse,
  type InventoryMovementsResponse,
} from "@/lib/api";

export const inventoryKeys = {
  all: ["inventory"] as const,
  levels: (params?: { limit?: number; offset?: number; locationId?: string }) =>
    ["inventory", "levels", params] as const,
  locations: (params?: { limit?: number; offset?: number }) =>
    ["inventory", "locations", params] as const,
  movements: (params?: {
    limit?: number;
    offset?: number;
    locationId?: string;
    movementType?: string;
  }) => ["inventory", "movements", params] as const,
};

/**
 * Hook for fetching inventory levels
 */
export function useInventoryLevels(params?: {
  limit?: number;
  offset?: number;
  locationId?: string;
}) {
  return useQuery<InventoryLevelsResponse>({
    queryKey: inventoryKeys.levels(params),
    queryFn: () => getInventoryLevels(params),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching stock locations
 */
export function useStockLocations(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery<StockLocationsResponse>({
    queryKey: inventoryKeys.locations(params),
    queryFn: () => getStockLocations(params),
    staleTime: 60000,
  });
}

/**
 * Hook for fetching inventory movements
 */
export function useInventoryMovements(
  params?: {
    limit?: number;
    offset?: number;
    locationId?: string;
    movementType?: string;
  },
  enabled: boolean = true
) {
  return useQuery<InventoryMovementsResponse>({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => getInventoryMovements(params),
    staleTime: 15000,
    enabled,
  });
}

/**
 * Mutation hook for adjusting inventory levels.
 * Invalidates both levels and movements queries on success.
 */
export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation<AdjustInventoryResponse, Error, AdjustInventoryRequest>({
    mutationFn: adjustInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
