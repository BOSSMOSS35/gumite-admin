import { create } from "zustand";
import type { ProductStatus } from "@/lib/api";

interface ProductFilters {
  searchQuery: string;
  status: ProductStatus | "all";
  categoryId: string; // "all" means no filter
}

interface ProductPagination {
  start: number;
  end: number;
}

interface ProductStoreState {
  // Filters
  filters: ProductFilters;
  pagination: ProductPagination;

  // UI state
  selectedProductIds: Set<string>;
  deleteDialogOpen: boolean;
  productToDeleteId: string | null;

  // Actions — filters
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ProductStatus | "all") => void;
  setCategoryFilter: (categoryId: string) => void;
  resetFilters: () => void;

  // Actions — pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;

  // Actions — selection
  toggleProductSelected: (id: string) => void;
  selectAllProducts: (ids: string[]) => void;
  clearSelection: () => void;
  isProductSelected: (id: string) => boolean;

  // Actions — delete dialog
  openDeleteDialog: (productId: string) => void;
  closeDeleteDialog: () => void;
}

const PAGE_SIZE = 20;

const defaultFilters: ProductFilters = {
  searchQuery: "",
  status: "all",
  categoryId: "all",
};

const defaultPagination: ProductPagination = {
  start: 0,
  end: PAGE_SIZE,
};

export const useProductStore = create<ProductStoreState>((set, get) => ({
  filters: { ...defaultFilters },
  pagination: { ...defaultPagination },
  selectedProductIds: new Set<string>(),
  deleteDialogOpen: false,
  productToDeleteId: null,

  // Filters
  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
      pagination: { ...defaultPagination }, // reset to first page
    })),

  setStatusFilter: (status) =>
    set((state) => ({
      filters: { ...state.filters, status },
      pagination: { ...defaultPagination },
    })),

  setCategoryFilter: (categoryId) =>
    set((state) => ({
      filters: { ...state.filters, categoryId },
      pagination: { ...defaultPagination },
    })),

  resetFilters: () =>
    set({
      filters: { ...defaultFilters },
      pagination: { ...defaultPagination },
    }),

  // Pagination
  nextPage: () =>
    set((state) => ({
      pagination: {
        start: state.pagination.start + PAGE_SIZE,
        end: state.pagination.end + PAGE_SIZE,
      },
    })),

  prevPage: () =>
    set((state) => ({
      pagination: {
        start: Math.max(0, state.pagination.start - PAGE_SIZE),
        end: Math.max(PAGE_SIZE, state.pagination.end - PAGE_SIZE),
      },
    })),

  goToPage: (page) =>
    set({
      pagination: {
        start: page * PAGE_SIZE,
        end: (page + 1) * PAGE_SIZE,
      },
    }),

  // Selection
  toggleProductSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedProductIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedProductIds: next };
    }),

  selectAllProducts: (ids) =>
    set({ selectedProductIds: new Set(ids) }),

  clearSelection: () =>
    set({ selectedProductIds: new Set<string>() }),

  isProductSelected: (id) => get().selectedProductIds.has(id),

  // Delete dialog
  openDeleteDialog: (productId) =>
    set({ deleteDialogOpen: true, productToDeleteId: productId }),

  closeDeleteDialog: () =>
    set({ deleteDialogOpen: false, productToDeleteId: null }),
}));

export { PAGE_SIZE };
