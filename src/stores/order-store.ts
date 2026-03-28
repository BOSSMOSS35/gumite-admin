import { create } from "zustand";

export type OrderFilter = {
  id: string;
  label: string;
  value: string;
};

interface OrderStoreState {
  // Filters
  searchQuery: string;
  activeFilters: OrderFilter[];
  // Pagination
  limit: number;
  offset: number;
  // Bulk selection
  selectedOrderIds: Set<string>;
  // Date range (ISO strings)
  dateFrom: string | null;
  dateTo: string | null;

  // Actions — filters
  setSearchQuery: (query: string) => void;
  addFilter: (filter: OrderFilter) => void;
  removeFilter: (filterId: string, value: string) => void;
  clearFilters: () => void;
  setDateRange: (from: string | null, to: string | null) => void;

  // Actions — pagination
  setOffset: (offset: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;

  // Actions — bulk selection
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: (orderIds: string[]) => void;
  deselectAllOrders: () => void;
  isOrderSelected: (orderId: string) => boolean;
}

export const useOrderStore = create<OrderStoreState>((set, get) => ({
  // Defaults
  searchQuery: "",
  activeFilters: [],
  limit: 20,
  offset: 0,
  selectedOrderIds: new Set(),
  dateFrom: null,
  dateTo: null,

  // Filters
  setSearchQuery: (query) =>
    set({ searchQuery: query, offset: 0 }),

  addFilter: (filter) =>
    set((state) => {
      const exists = state.activeFilters.some(
        (f) => f.id === filter.id && f.value === filter.value,
      );
      if (exists) return state;
      return {
        activeFilters: [...state.activeFilters, filter],
        offset: 0,
      };
    }),

  removeFilter: (filterId, value) =>
    set((state) => ({
      activeFilters: state.activeFilters.filter(
        (f) => !(f.id === filterId && f.value === value),
      ),
      offset: 0,
    })),

  clearFilters: () =>
    set({ activeFilters: [], offset: 0 }),

  setDateRange: (from, to) =>
    set({ dateFrom: from, dateTo: to, offset: 0 }),

  // Pagination
  setOffset: (offset) => set({ offset }),
  setLimit: (limit) => set({ limit, offset: 0 }),
  resetPagination: () => set({ offset: 0 }),

  // Bulk selection
  toggleOrderSelection: (orderId) =>
    set((state) => {
      const next = new Set(state.selectedOrderIds);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return { selectedOrderIds: next };
    }),

  selectAllOrders: (orderIds) =>
    set({ selectedOrderIds: new Set(orderIds) }),

  deselectAllOrders: () =>
    set({ selectedOrderIds: new Set() }),

  isOrderSelected: (orderId) => get().selectedOrderIds.has(orderId),
}));
