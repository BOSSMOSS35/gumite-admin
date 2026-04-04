import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  type AdminBrandsResponse,
  type CreateBrandInput,
  type UpdateBrandInput,
  type Brand,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const brandKeys = {
  all: ["brands"] as const,
  lists: () => [...brandKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...brandKeys.lists(), params] as const,
  details: () => [...brandKeys.all, "detail"] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────

interface UseBrandsParams {
  offset?: number;
  limit?: number;
  q?: string;
}

export function useBrands(params?: UseBrandsParams) {
  return useQuery<AdminBrandsResponse>({
    queryKey: brandKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getBrands(params),
  });
}

export function useBrand(id: string | undefined) {
  return useQuery<{ brand: Brand }>({
    queryKey: brandKeys.detail(id!),
    queryFn: () => getBrand(id!),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBrandInput) => createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBrandInput;
    }) => updateBrand(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}
