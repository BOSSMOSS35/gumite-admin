import { create } from "zustand";
import type { CustomerTier, CustomerStatus, CustomerSummary } from "@/lib/api";

// ============================================================================
// Customer UI State (Zustand)
// Server data lives in React Query — this is purely for client-side UI.
// ============================================================================

interface CustomerUIState {
  // Search & filters
  search: string;
  tierFilter: CustomerTier | "all";
  statusFilter: CustomerStatus | "all";
  setSearch: (search: string) => void;
  setTierFilter: (tier: CustomerTier | "all") => void;
  setStatusFilter: (status: CustomerStatus | "all") => void;
  resetFilters: () => void;

  // Selection (for bulk actions)
  selectedCustomerIds: Set<string>;
  selectCustomer: (id: string) => void;
  deselectCustomer: (id: string) => void;
  toggleCustomer: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;

  // Dialog state
  selectedCustomer: CustomerSummary | null;
  setSelectedCustomer: (customer: CustomerSummary | null) => void;

  emailDialogOpen: boolean;
  setEmailDialogOpen: (open: boolean) => void;

  giftCardDialogOpen: boolean;
  setGiftCardDialogOpen: (open: boolean) => void;

  suspendDialogOpen: boolean;
  setSuspendDialogOpen: (open: boolean) => void;

  changeTierDialogOpen: boolean;
  setChangeTierDialogOpen: (open: boolean) => void;

  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;

  // Convenience: open a dialog for a specific customer
  openDialogFor: (
    customer: CustomerSummary,
    dialog: "email" | "giftCard" | "suspend" | "changeTier"
  ) => void;

  // Close all dialogs and clear selected customer
  closeDialogs: () => void;
}

export const useCustomerStore = create<CustomerUIState>((set) => ({
  // Search & filters
  search: "",
  tierFilter: "all",
  statusFilter: "all",
  setSearch: (search) => set({ search }),
  setTierFilter: (tierFilter) => set({ tierFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () =>
    set({ search: "", tierFilter: "all", statusFilter: "all" }),

  // Selection
  selectedCustomerIds: new Set(),
  selectCustomer: (id) =>
    set((state) => {
      const next = new Set(state.selectedCustomerIds);
      next.add(id);
      return { selectedCustomerIds: next };
    }),
  deselectCustomer: (id) =>
    set((state) => {
      const next = new Set(state.selectedCustomerIds);
      next.delete(id);
      return { selectedCustomerIds: next };
    }),
  toggleCustomer: (id) =>
    set((state) => {
      const next = new Set(state.selectedCustomerIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedCustomerIds: next };
    }),
  selectAll: (ids) => set({ selectedCustomerIds: new Set(ids) }),
  deselectAll: () => set({ selectedCustomerIds: new Set() }),

  // Dialog state
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  emailDialogOpen: false,
  setEmailDialogOpen: (open) => set({ emailDialogOpen: open }),

  giftCardDialogOpen: false,
  setGiftCardDialogOpen: (open) => set({ giftCardDialogOpen: open }),

  suspendDialogOpen: false,
  setSuspendDialogOpen: (open) => set({ suspendDialogOpen: open }),

  changeTierDialogOpen: false,
  setChangeTierDialogOpen: (open) => set({ changeTierDialogOpen: open }),

  createDialogOpen: false,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),

  openDialogFor: (customer, dialog) =>
    set({
      selectedCustomer: customer,
      emailDialogOpen: dialog === "email",
      giftCardDialogOpen: dialog === "giftCard",
      suspendDialogOpen: dialog === "suspend",
      changeTierDialogOpen: dialog === "changeTier",
    }),

  closeDialogs: () =>
    set({
      selectedCustomer: null,
      emailDialogOpen: false,
      giftCardDialogOpen: false,
      suspendDialogOpen: false,
      changeTierDialogOpen: false,
      createDialogOpen: false,
    }),
}));
