import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getCategories,
  type ProductStatus,
  type ProductsResponse,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type UploadImageResponse,
  type AdminCategoriesResponse,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: object) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => ["categories"] as const,
};

// ─── Queries ──────────────────────────────────────────────────

interface UseProductsParams {
  start?: number;
  end?: number;
  q?: string;
  status?: ProductStatus;
}

export function useProducts(params?: UseProductsParams) {
  return useQuery<ProductsResponse>({
    queryKey: productKeys.list(params ?? {}),
    queryFn: () => getProducts(params),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery<Product>({
    queryKey: productKeys.detail(id!),
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}

export function useCategories(params?: {
  offset?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}) {
  return useQuery<AdminCategoriesResponse>({
    queryKey: [...productKeys.categories(), params ?? {}],
    queryFn: () => getCategories(params),
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductInput>({
    mutationFn: (data) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { id: string; data: UpdateProductInput }
  >({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUploadProductImage() {
  return useMutation<
    UploadImageResponse,
    Error,
    { file: File; productId?: string }
  >({
    mutationFn: ({ file, productId }) => uploadProductImage(file, productId),
  });
}
