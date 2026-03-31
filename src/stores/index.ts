// Local store config — replaces @vernont/admin-ui/stores dependency

export interface StoreConfig {
  apiBaseUrl: string;
  wsEndpoint: string;
  wsTokenEndpoint: string;
}

let config: StoreConfig = {
  apiBaseUrl: "",
  wsEndpoint: "/ws",
  wsTokenEndpoint: "/api/v1/internal/auth/ws-token",
};

export function setStoreConfig(partial: Partial<StoreConfig>) {
  config = { ...config, ...partial };
}

export function getStoreConfig(): StoreConfig {
  return config;
}

export function getApiUrl(endpoint: string): string {
  return `${config.apiBaseUrl}${endpoint}`;
}

export function getWsUrl(): string {
  return `${config.apiBaseUrl}${config.wsEndpoint}`;
}

// Re-export local stores
export { useProductStore } from "./product-store";
export { useOrderStore } from "./order-store";
export { useCustomerStore } from "./customer-store";
export { useProductFormStore } from "./product-form-store";
export { useAuthStore } from "./auth-store";
