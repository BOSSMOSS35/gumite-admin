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
  createVariant,
  updateVariant,
  deleteVariant,
  addOption,
  updateOption,
  deleteOption,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  setProductThumbnail,
  type ProductStatus,
  type ProductsResponse,
  type Product,
  type ProductVariant,
  type CreateProductInput,
  type UpdateProductInput,
  type UploadImageResponse,
  type AdminCategoriesResponse,
  type CreateVariantInput,
  type UpdateVariantInput,
  type CreateOptionInput,
  type UpdateOptionInput,
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
  categoryId?: string;
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

// ─── Variant Mutations ────────────────────────────────────────

export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductVariant,
    Error,
    { productId: string; data: CreateVariantInput }
  >({
    mutationFn: ({ productId, data }) => createVariant(productId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductVariant,
    Error,
    { variantId: string; data: UpdateVariantInput; productId: string }
  >({
    mutationFn: ({ variantId, data }) => updateVariant(variantId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { variantId: string; productId: string }
  >({
    mutationFn: ({ variantId }) => deleteVariant(variantId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

// ─── Option Mutations ─────────────────────────────────────────

export function useAddOption() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; data: CreateOptionInput }
  >({
    mutationFn: ({ productId, data }) => addOption(productId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useUpdateOption() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; optionId: string; data: UpdateOptionInput }
  >({
    mutationFn: ({ productId, optionId, data }) =>
      updateOption(productId, optionId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useDeleteOption() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; optionId: string }
  >({
    mutationFn: ({ productId, optionId }) => deleteOption(productId, optionId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

// ─── Image Mutations ──────────────────────────────────────────

export function useAddProductImage() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; data: { url: string; position: number } }
  >({
    mutationFn: ({ productId, data }) => addProductImage(productId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; imageId: string }
  >({
    mutationFn: ({ productId, imageId }) => deleteProductImage(productId, imageId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useReorderProductImages() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; imageIds: string[] }
  >({
    mutationFn: ({ productId, imageIds }) =>
      reorderProductImages(productId, imageIds),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}

export function useSetProductThumbnail() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { productId: string; imageId: string }
  >({
    mutationFn: ({ productId, imageId }) =>
      setProductThumbnail(productId, imageId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
  });
}
