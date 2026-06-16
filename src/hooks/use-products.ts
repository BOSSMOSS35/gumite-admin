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

  return useMutation<
    void,
    Error,
    string,
    { previousProducts: [queryKey: readonly unknown[], data: unknown][] }
  >({
    mutationFn: (id) => deleteProduct(id),
    // Optimistic update - remove product from UI immediately
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: productKeys.lists() });

      // Optimistically remove from all product lists
      queryClient.setQueriesData<ProductsResponse>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((p) => p.id !== productId),
            totalElements: old.totalElements - 1,
          };
        }
      );

      return { previousProducts };
    },
    onSuccess: (_result, productId) => {
      // Invalidate to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
    onError: (_error, _productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
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
    { productId: string; data: CreateVariantInput },
    { previousProduct: Product | undefined }
  >({
    mutationFn: ({ productId, data }) => createVariant(productId, data),
    onMutate: async ({ productId, data }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) });
      const previousProduct = queryClient.getQueryData<Product>(productKeys.detail(productId));

      queryClient.setQueryData<Product>(productKeys.detail(productId), (old) => {
        if (!old) return old;
        const newVariant: ProductVariant = {
          id: `temp-${Date.now()}`,
          productId: productId,
          title: data.title || "New Variant",
          options: data.options || {},
          allowBackorder: data.allowBackorder || false,
          manageInventory: data.manageInventory !== false,
          prices: (data.prices || []).map((p, i) => ({
            id: `price-${Date.now()}-${i}`,
            currencyCode: p.currencyCode || "GBP",
            amount: p.amount || 0,
            hasDiscount: false,
          })),
          sku: data.sku,
          barcode: data.barcode,
          inventoryQuantity: data.inventoryQuantity || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...old,
          variants: [...(old.variants || []), newVariant]
        };
      });

      return { previousProduct };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
    onError: (_error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(variables.productId), context.previousProduct);
      }
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation<
    ProductVariant,
    Error,
    { variantId: string; data: UpdateVariantInput; productId: string },
    { previousProduct: Product | undefined }
  >({
    mutationFn: ({ variantId, data }) => updateVariant(variantId, data),
    onMutate: async ({ productId, variantId, data }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) });
      const previousProduct = queryClient.getQueryData<Product>(productKeys.detail(productId));

      queryClient.setQueryData<Product>(productKeys.detail(productId), (old) => {
        if (!old || !old.variants) return old;
        return {
          ...old,
          variants: old.variants.map((v) => {
            if (v.id !== variantId) return v;
            
            // Map prices to correct type if they exist in data
            const updatedPrices = data.prices 
              ? data.prices.map((p, i) => {
                  const existingPrice = v.prices[i] || {};
                  return {
                    id: existingPrice.id || `price-${Date.now()}-${i}`,
                    currencyCode: p.currencyCode || existingPrice.currencyCode || "GBP",
                    amount: p.amount ?? existingPrice.amount ?? 0,
                    hasDiscount: existingPrice.hasDiscount || false,
                  };
                })
              : v.prices;

            return {
              ...v,
              ...data,
              prices: updatedPrices,
            };
          })
        };
      });

      return { previousProduct };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
    onError: (_error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(variables.productId), context.previousProduct);
      }
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { variantId: string; productId: string },
    { previousProduct: Product | undefined }
  >({
    mutationFn: ({ variantId }) => deleteVariant(variantId),
    onMutate: async ({ productId, variantId }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) });
      const previousProduct = queryClient.getQueryData<Product>(productKeys.detail(productId));

      queryClient.setQueryData<Product>(productKeys.detail(productId), (old) => {
        if (!old || !old.variants) return old;
        return {
          ...old,
          variants: old.variants.filter((v) => v.id !== variantId)
        };
      });

      return { previousProduct };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
    },
    onError: (_error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(variables.productId), context.previousProduct);
      }
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
