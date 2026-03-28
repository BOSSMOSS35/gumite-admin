import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  publishCollection,
  uploadCollectionImage,
  addProductsToCollection,
  removeProductsFromCollection,
  type AdminCollectionsResponse,
  type CreateCollectionInput,
  type ProductCollection,
  type CollectionUploadResponse,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...collectionKeys.lists(), params] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────

interface UseCollectionsParams {
  offset?: number;
  limit?: number;
}

export function useCollections(params?: UseCollectionsParams) {
  return useQuery<AdminCollectionsResponse>({
    queryKey: collectionKeys.list(params ?? {}),
    queryFn: () => getCollections(params),
  });
}

export function useCollection(id: string | undefined) {
  return useQuery<{ collection: ProductCollection }>({
    queryKey: collectionKeys.detail(id!),
    queryFn: () => getCollection(id!),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionInput) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCollectionInput>;
    }) => updateCollection(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function usePublishCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishCollection(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(id),
      });
    },
  });
}

export function useUploadCollectionImage() {
  const queryClient = useQueryClient();

  return useMutation<
    CollectionUploadResponse,
    Error,
    { file: File; collectionId?: string }
  >({
    mutationFn: ({ file, collectionId }) =>
      uploadCollectionImage(file, collectionId),
    onSuccess: (_data, variables) => {
      if (variables.collectionId) {
        queryClient.invalidateQueries({
          queryKey: collectionKeys.detail(variables.collectionId),
        });
      }
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useAddProductsToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      productIds,
    }: {
      collectionId: string;
      productIds: string[];
    }) => addProductsToCollection(collectionId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}

export function useRemoveProductsFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      productIds,
    }: {
      collectionId: string;
      productIds: string[];
    }) => removeProductsFromCollection(collectionId, productIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });
}
