import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAdminRegions,
  createAdminRegion,
  updateStore,
  getTaxRegions,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  type AdminRegionsResponse,
  type CreateRegionsResponse,
  type AdminCreateRegionRequest,
  type TaxRegionsResponse,
  type TaxRateResponse,
  type CreateTaxRateRequest,
  type UpdateTaxRateRequest,
  type UpdateStoreRequest,
  type StoreResponse,
} from "@/lib/api";
import { storeKeys } from "./use-settings";

// ─── Query key factory ────────────────────────────────────────
export const regionKeys = {
  all: ["regions"] as const,
  lists: () => [...regionKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...regionKeys.lists(), params] as const,
  taxRegions: () => ["tax-regions"] as const,
  taxRegionList: (params: Record<string, unknown>) =>
    [...regionKeys.taxRegions(), params] as const,
};

// ─── Queries ──────────────────────────────────────────────────

export function useRegions(params?: { limit?: number; offset?: number }) {
  return useQuery<AdminRegionsResponse>({
    queryKey: regionKeys.list(params ?? {}),
    queryFn: () => getAdminRegions(params),
  });
}

export function useTaxRegions(params?: { limit?: number; offset?: number }) {
  return useQuery<TaxRegionsResponse>({
    queryKey: regionKeys.taxRegionList(params ?? {}),
    queryFn: () => getTaxRegions(params),
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateRegion() {
  const queryClient = useQueryClient();

  return useMutation<CreateRegionsResponse, Error, AdminCreateRegionRequest>({
    mutationFn: (data) => createAdminRegion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regionKeys.taxRegions() });
    },
  });
}

export function useSetDefaultRegion() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreResponse,
    Error,
    { storeId: string; regionId: string }
  >({
    mutationFn: ({ storeId, regionId }) =>
      updateStore(storeId, { defaultRegionId: regionId } as UpdateStoreRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

export function useCreateTaxRate() {
  const queryClient = useQueryClient();

  return useMutation<TaxRateResponse, Error, CreateTaxRateRequest>({
    mutationFn: (data) => createTaxRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxRegions() });
    },
  });
}

export function useUpdateTaxRate() {
  const queryClient = useQueryClient();

  return useMutation<
    TaxRateResponse,
    Error,
    { id: string; data: UpdateTaxRateRequest }
  >({
    mutationFn: ({ id, data }) => updateTaxRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxRegions() });
    },
  });
}

export function useDeleteTaxRate() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; deleted: boolean }, Error, string>({
    mutationFn: (id) => deleteTaxRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.taxRegions() });
    },
  });
}
