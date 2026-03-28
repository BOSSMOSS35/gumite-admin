import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getStores,
  getStoreSettings,
  createStore,
  updateStore,
  initializeStoreSettings,
  updateStoreBusinessInfo,
  updateStoreLocalization,
  updateStoreFeatures,
  updateStorePolicies,
  updateStoreCheckoutSettings,
  updateStoreShippingSettings,
  updateStoreSeoSettings,
  updateStoreThemeSettings,
  type StoresResponse,
  type StoreResponse,
  type StoreSettingsResponse,
  type CreateStoreRequest,
  type UpdateStoreRequest,
  type UpdateBusinessInfoRequest,
  type UpdateLocalizationRequest,
  type UpdateFeaturesRequest,
  type UpdatePoliciesRequest,
  type UpdateCheckoutSettingsRequest,
  type UpdateShippingSettingsRequest,
  type UpdateSeoSettingsRequest,
  type UpdateThemeSettingsRequest,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const storeKeys = {
  all: ["stores"] as const,
  lists: () => [...storeKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...storeKeys.lists(), params] as const,
  details: () => [...storeKeys.all, "detail"] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
  settings: (storeId: string) =>
    [...storeKeys.all, "settings", storeId] as const,
};

// ─── Queries ──────────────────────────────────────────────────

export function useStores(params?: { limit?: number; offset?: number }) {
  return useQuery<StoresResponse>({
    queryKey: storeKeys.list(params ?? {}),
    queryFn: () => getStores(params),
  });
}

export function useStoreSettings(storeId: string | undefined) {
  return useQuery<StoreSettingsResponse>({
    queryKey: storeKeys.settings(storeId!),
    queryFn: async () => {
      try {
        return await getStoreSettings(storeId!);
      } catch {
        // Initialize settings if they don't exist yet
        return await initializeStoreSettings(storeId!);
      }
    },
    enabled: !!storeId,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation<StoreResponse, Error, CreateStoreRequest>({
    mutationFn: (data) => createStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.lists() });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreResponse,
    Error,
    { storeId: string; data: UpdateStoreRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStore(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

export function useUpdateBusinessInfo() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateBusinessInfoRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStoreBusinessInfo(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateLocalization() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateLocalizationRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStoreLocalization(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateFeatures() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateFeaturesRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStoreFeatures(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdatePolicies() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdatePoliciesRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStorePolicies(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateCheckoutSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateCheckoutSettingsRequest }
  >({
    mutationFn: ({ storeId, data }) =>
      updateStoreCheckoutSettings(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateShippingSettingsRequest }
  >({
    mutationFn: ({ storeId, data }) =>
      updateStoreShippingSettings(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateSeoSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateSeoSettingsRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStoreSeoSettings(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}

export function useUpdateThemeSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    StoreSettingsResponse,
    Error,
    { storeId: string; data: UpdateThemeSettingsRequest }
  >({
    mutationFn: ({ storeId, data }) => updateStoreThemeSettings(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({
        queryKey: storeKeys.settings(storeId),
      });
    },
  });
}
