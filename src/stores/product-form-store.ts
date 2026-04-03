import { create } from "zustand";

// --- Types ---

export type VariantPricing = {
  optionValues: Record<string, string>;
  price: string;
  sku: string;
  quantity: string;
};

export type ProductOption = {
  name: string;
  values: string[];
};

export interface ProductFormState {
  // Step navigation
  currentStep: number;

  // Details
  title: string;
  subtitle: string;
  handle: string;
  description: string;
  hasVariants: boolean;

  // Media
  images: File[];

  // Organize
  category: string;
  collection: string;
  brandId: string;
  tags: string[];

  // Variants
  options: ProductOption[];
  variantPrices: VariantPricing[];

  // Pricing (simple product)
  price: string;
  compareAtPrice: string;
  costPerItem: string;

  // Inventory (simple product)
  sku: string;
  barcode: string;
  quantity: string;
  trackQuantity: boolean;

  // UI state
  saving: boolean;
  error: string | null;
}

// --- Helpers ---

function generateVariantCombinations(
  options: ProductOption[]
): Record<string, string>[] {
  const validOptions = options.filter((o) => o.name && o.values.some((v) => v));
  if (validOptions.length === 0) return [];

  const cartesian = (arrays: string[][]): string[][] => {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restCombinations = cartesian(rest);
    return first.flatMap((val) =>
      restCombinations.map((combo) => [val, ...combo])
    );
  };

  const optionNames = validOptions.map((o) => o.name);
  const optionValues = validOptions.map((o) => o.values.filter((v) => v));
  const combinations = cartesian(optionValues);

  return combinations.map((combo) => {
    const result: Record<string, string> = {};
    optionNames.forEach((name, idx) => {
      result[name] = combo[idx];
    });
    return result;
  });
}

export function getVariantDisplayName(
  optionValues: Record<string, string>
): string {
  return Object.values(optionValues).join(" / ");
}

function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Recompute variant prices from options, preserving existing user input
 * via exact match -> fuzzy (sorted values) match -> positional match.
 */
function reconcileVariantPrices(
  combinations: Record<string, string>[],
  existingPrices: VariantPricing[]
): VariantPricing[] {
  const comboKey = (combo: Record<string, string>) =>
    Object.values(combo).sort().join("|").toLowerCase();

  return combinations.map((combo, idx) => {
    // 1. Exact match
    const exactMatch = existingPrices.find(
      (vp) => JSON.stringify(vp.optionValues) === JSON.stringify(combo)
    );
    if (exactMatch) return exactMatch;

    // 2. Fuzzy match (handles option name renames)
    const key = comboKey(combo);
    const fuzzyMatch = existingPrices.find(
      (vp) => comboKey(vp.optionValues) === key
    );
    if (fuzzyMatch) return { ...fuzzyMatch, optionValues: combo };

    // 3. Positional match (preserves pricing when editing option names)
    const positional = existingPrices[idx];
    if (positional && positional.price)
      return { ...positional, optionValues: combo };

    // 4. New empty entry
    return { optionValues: combo, price: "", sku: "", quantity: "" };
  });
}

// --- Store ---

export interface ProductFormActions {
  // Field updates
  setField: <K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K]
  ) => void;
  setTitle: (title: string) => void;

  // Step navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Images
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;

  // Tags
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Options (variant axes)
  addOption: () => void;
  removeOption: (index: number) => void;
  updateOptionName: (index: number, name: string) => void;
  addOptionValue: (optionIndex: number) => void;
  updateOptionValue: (
    optionIndex: number,
    valueIndex: number,
    value: string
  ) => void;
  removeOptionValue: (optionIndex: number, valueIndex: number) => void;

  // Bulk option helpers
  addOptionWithValues: (name: string, values: string[]) => void;
  replaceOptionValues: (optionIndex: number, values: string[]) => void;

  // Variant pricing
  updateVariantPrice: (
    index: number,
    field: keyof VariantPricing,
    value: string
  ) => void;
  setAllVariantPrices: (price: string) => void;
  setAllVariantQuantities: (quantity: string) => void;

  // Computed
  getVariantCombinations: () => Record<string, string>[];

  // Saving state
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState: ProductFormState = {
  currentStep: 0,
  title: "",
  subtitle: "",
  handle: "",
  description: "",
  hasVariants: false,
  images: [],
  category: "",
  collection: "",
  brandId: "",
  tags: [],
  options: [],
  variantPrices: [],
  price: "",
  compareAtPrice: "",
  costPerItem: "",
  sku: "",
  barcode: "",
  quantity: "",
  trackQuantity: true,
  saving: false,
  error: null,
};

export const useProductFormStore = create<ProductFormState & ProductFormActions>(
  (set, get) => ({
    ...initialState,

    // --- Field updates ---
    setField: (field, value) => set({ [field]: value }),

    setTitle: (title) => {
      const state = get();
      const updates: Partial<ProductFormState> = { title };
      if (!state.handle) {
        updates.handle = generateHandle(title);
      }
      set(updates);
    },

    // --- Step navigation ---
    goToStep: (step) => set({ currentStep: step }),
    nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 2) })),
    prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

    // --- Images ---
    addImages: (files) =>
      set((s) => ({ images: [...s.images, ...files] })),
    removeImage: (index) =>
      set((s) => ({ images: s.images.filter((_, i) => i !== index) })),

    // --- Tags ---
    addTag: (tag) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      set((s) => {
        if (s.tags.includes(trimmed)) return s;
        return { tags: [...s.tags, trimmed] };
      });
    },
    removeTag: (tag) =>
      set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),

    // --- Options ---
    addOption: () =>
      set((s) => {
        const newOptions = [...s.options, { name: "", values: [""] }];
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    removeOption: (index) =>
      set((s) => {
        const newOptions = s.options.filter((_, i) => i !== index);
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    updateOptionName: (index, name) =>
      set((s) => {
        const newOptions = s.options.map((o, i) =>
          i === index ? { ...o, name } : o
        );
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    addOptionValue: (optionIndex) =>
      set((s) => {
        const newOptions = s.options.map((o, i) =>
          i === optionIndex ? { ...o, values: [...o.values, ""] } : o
        );
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    updateOptionValue: (optionIndex, valueIndex, value) =>
      set((s) => {
        const newOptions = s.options.map((o, i) =>
          i === optionIndex
            ? {
                ...o,
                values: o.values.map((v, vi) => (vi === valueIndex ? value : v)),
              }
            : o
        );
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    removeOptionValue: (optionIndex, valueIndex) =>
      set((s) => {
        const newOptions = s.options.map((o, i) =>
          i === optionIndex
            ? { ...o, values: o.values.filter((_, vi) => vi !== valueIndex) }
            : o
        );
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    // --- Bulk option helpers ---
    addOptionWithValues: (name, values) =>
      set((s) => {
        const newOptions = [...s.options, { name, values }];
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    replaceOptionValues: (optionIndex, values) =>
      set((s) => {
        const newOptions = s.options.map((o, i) =>
          i === optionIndex ? { ...o, values } : o
        );
        const combinations = generateVariantCombinations(newOptions);
        return {
          options: newOptions,
          variantPrices: reconcileVariantPrices(combinations, s.variantPrices),
        };
      }),

    // --- Variant pricing ---
    updateVariantPrice: (index, field, value) =>
      set((s) => ({
        variantPrices: s.variantPrices.map((vp, i) =>
          i === index ? { ...vp, [field]: value } : vp
        ),
      })),

    setAllVariantPrices: (price) =>
      set((s) => ({
        variantPrices: s.variantPrices.map((vp) => ({ ...vp, price })),
      })),

    setAllVariantQuantities: (quantity) =>
      set((s) => ({
        variantPrices: s.variantPrices.map((vp) => ({ ...vp, quantity })),
      })),

    // --- Computed ---
    getVariantCombinations: () => generateVariantCombinations(get().options),

    // --- Saving ---
    setSaving: (saving) => set({ saving }),
    setError: (error) => set({ error }),

    // --- Reset ---
    reset: () => set(initialState),
  })
);
