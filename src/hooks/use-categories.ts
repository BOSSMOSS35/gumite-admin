import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
  getCategoryProducts,
  addProductsToCategory,
  removeProductsFromCategory,
  moveProductToCategory,
  type AdminCategoriesResponse,
  type CreateCategoryInput,
  type ProductCategory,
  type CategoryProductsResponse,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  products: (categoryId: string) =>
    [...categoryKeys.detail(categoryId), "products"] as const,
};

// ─── Queries ──────────────────────────────────────────────────

interface UseCategoriesParams {
  offset?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

export function useCategories(params?: UseCategoriesParams) {
  return useQuery<AdminCategoriesResponse>({
    queryKey: categoryKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getCategories(params),
  });
}

export function useCategory(id: string | undefined) {
  return useQuery<{ category: ProductCategory }>({
    queryKey: categoryKeys.detail(id!),
    queryFn: () => getCategory(id!),
    enabled: !!id,
  });
}

export function useCategoryProducts(
  categoryId: string | undefined,
  params?: { offset?: number; limit?: number }
) {
  return useQuery<CategoryProductsResponse>({
    queryKey: categoryKeys.products(categoryId!),
    queryFn: () => getCategoryProducts(categoryId!, params),
    enabled: !!categoryId,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCategoryInput>;
    }) => updateCategory(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useActivateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(id),
      });
    },
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(id),
      });
    },
  });
}

export function useAddProductsToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      productIds,
    }: {
      categoryId: string;
      productIds: string[];
    }) => addProductsToCategory(categoryId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.products(variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useRemoveProductsFromCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      productIds,
    }: {
      categoryId: string;
      productIds: string[];
    }) => removeProductsFromCategory(categoryId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.products(variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useMoveProductToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetCategoryId,
      productId,
      fromCategoryId,
    }: {
      targetCategoryId: string;
      productId: string;
      fromCategoryId?: string;
    }) => moveProductToCategory(targetCategoryId, productId, fromCategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
