"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  X,
  Upload,
  Info,
  Check,
  Circle,
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  Loader2,
  Ruler,
  Palette,
  Layers,
  Pencil,
  Shirt,
  Footprints,
} from "lucide-react";
import {
  getCategories,
  getCollections,
  createProduct,
  uploadProductImage,
  type ProductCategory,
  type ProductCollection,
  type CreateProductInput,
} from "@/lib/api";
import {
  useProductFormStore,
  getVariantDisplayName,
  type ProductFormState,
  type ProductFormActions,
} from "@/stores/product-form-store";

type Step = {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
};

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (isDraft: boolean) => void;
};

// --- Size presets ---
const SHOE_SIZES_EU = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// --- Chip tag input for option values ---
function ChipTagInput({
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !values.includes(trimmed)) {
        onAdd(trimmed);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && values.length > 0) {
      onRemove(values.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border rounded-md px-2 py-1.5 min-h-[38px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
      {values.filter(Boolean).map((value, idx) => (
        <Badge
          key={`${value}-${idx}`}
          variant="secondary"
          className="gap-1 px-2 py-0.5 text-sm font-normal"
        >
          {value}
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="ml-0.5 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.filter(Boolean).length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// --- Toggleable chip selector (for presets) ---
function ToggleChips({
  allValues,
  selectedValues,
  onToggle,
}: {
  allValues: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {allValues.map((value) => {
        const isSelected = selectedValues.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

// --- Variant Step Component ---
type VariantStepProps = {
  store: ProductFormState & ProductFormActions;
  variantCombinations: Record<string, string>[];
};

function VariantStep({ store, variantCombinations }: VariantStepProps) {
  const [sizeSubType, setSizeSubType] = React.useState<"shoe" | "clothing" | null>(null);

  const handlePresetClick = (preset: "size" | "color" | "material" | "custom") => {
    if (preset === "size") {
      // Don't add yet -- show sub-option picker
      setSizeSubType(null);
      // Temporarily add the option with empty values so user picks sub-type
      store.addOptionWithValues("Size", []);
    } else if (preset === "color") {
      store.addOptionWithValues("Color", []);
    } else if (preset === "material") {
      store.addOptionWithValues("Material", []);
    } else {
      store.addOption();
    }
  };

  const handleSizeSubType = (type: "shoe" | "clothing", optIdx: number) => {
    setSizeSubType(type);
    const values = type === "shoe" ? [...SHOE_SIZES_EU] : [...CLOTHING_SIZES];
    store.replaceOptionValues(optIdx, values);
  };

  const handleToggleSizeValue = (value: string, optIdx: number) => {
    const currentValues = store.options[optIdx]?.values || [];
    if (currentValues.includes(value)) {
      const newValues = currentValues.filter((v) => v !== value);
      store.replaceOptionValues(optIdx, newValues);
    } else {
      store.replaceOptionValues(optIdx, [...currentValues, value]);
    }
  };

  const handleChipAdd = (optionIndex: number, value: string) => {
    const currentValues = store.options[optionIndex]?.values.filter(Boolean) || [];
    if (!currentValues.includes(value)) {
      store.replaceOptionValues(optionIndex, [...currentValues, value]);
    }
  };

  const handleChipRemove = (optionIndex: number, valueIndex: number) => {
    const currentValues = store.options[optionIndex]?.values.filter(Boolean) || [];
    store.replaceOptionValues(
      optionIndex,
      currentValues.filter((_, i) => i !== valueIndex)
    );
  };

  // Variant summary computation
  const variantSummary = React.useMemo(() => {
    const validOptions = store.options.filter(
      (o) => o.name && o.values.some((v) => v)
    );
    if (validOptions.length === 0) return null;
    const parts = validOptions.map(
      (o) => `${o.values.filter((v) => v).length} ${o.name.toLowerCase()}${o.values.filter((v) => v).length !== 1 ? "s" : ""}`
    );
    return {
      total: variantCombinations.length,
      breakdown: parts.join(" x "),
    };
  }, [store.options, variantCombinations.length]);

  // Group variants by first option for the pricing table
  const groupedVariants = React.useMemo(() => {
    if (store.variantPrices.length === 0) return [];
    const firstOptionName = store.options.find(
      (o) => o.name && o.values.some((v) => v)
    )?.name;
    if (!firstOptionName) return [{ header: null, variants: store.variantPrices.map((vp, i) => ({ ...vp, _idx: i })) }];

    const groups: { header: string; variants: (typeof store.variantPrices[0] & { _idx: number })[] }[] = [];
    const seen = new Set<string>();

    store.variantPrices.forEach((vp, idx) => {
      const groupKey = vp.optionValues[firstOptionName] || "";
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        groups.push({ header: groupKey, variants: [] });
      }
      const group = groups.find((g) => g.header === groupKey);
      if (group) group.variants.push({ ...vp, _idx: idx });
    });

    return groups;
  }, [store.variantPrices, store.options]);

  // Simple product -- no variants
  if (!store.hasVariants) {
    return (
      <div className="text-center py-12">
        <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Simple Product</h3>
        <p className="text-muted-foreground">
          This product doesn&apos;t have variants. A default variant will be created for
          you with the pricing and inventory settings from the previous step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Options section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Product Options</h2>
          {store.options.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={store.addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add option
            </Button>
          )}
        </div>

        {/* Empty state with presets */}
        {store.options.length === 0 && (
          <div className="py-10 border rounded-lg text-center space-y-6">
            <div>
              <h3 className="text-base font-medium mb-1">What varies about this product?</h3>
              <p className="text-sm text-muted-foreground">
                Pick a common option type or create your own.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-5 flex-col gap-1.5"
                onClick={() => handlePresetClick("size")}
              >
                <Ruler className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Size</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-5 flex-col gap-1.5"
                onClick={() => handlePresetClick("color")}
              >
                <Palette className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Color</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-5 flex-col gap-1.5"
                onClick={() => handlePresetClick("material")}
              >
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Material</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-3 px-5 flex-col gap-1.5"
                onClick={() => handlePresetClick("custom")}
              >
                <Pencil className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Custom</span>
              </Button>
            </div>
          </div>
        )}

        {/* Existing options */}
        {store.options.length > 0 && (
          <div className="space-y-4">
            {store.options.map((option, optionIndex) => {
              const isSizeOption = option.name.toLowerCase() === "size";
              const currentSizeType =
                isSizeOption && sizeSubType
                  ? sizeSubType
                  : isSizeOption && option.values.some((v) => SHOE_SIZES_EU.includes(v))
                  ? "shoe"
                  : isSizeOption && option.values.some((v) => CLOTHING_SIZES.includes(v))
                  ? "clothing"
                  : null;

              return (
                <div key={optionIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Option name</Label>
                      <Input
                        placeholder="Size, Color, Material..."
                        value={option.name}
                        onChange={(e) =>
                          store.updateOptionName(optionIndex, e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => store.removeOption(optionIndex)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Size sub-type selector */}
                  {isSizeOption && option.values.filter(Boolean).length === 0 && (
                    <div className="ml-8 space-y-3">
                      <Label className="text-xs text-muted-foreground">Choose a size type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleSizeSubType("shoe", optionIndex)}
                        >
                          <Footprints className="h-4 w-4" />
                          Shoe sizes (EU)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleSizeSubType("clothing", optionIndex)}
                        >
                          <Shirt className="h-4 w-4" />
                          Clothing sizes
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Toggle chips for size presets */}
                  {isSizeOption && currentSizeType && (
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          {currentSizeType === "shoe" ? "EU shoe sizes" : "Clothing sizes"}
                        </Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            const otherType = currentSizeType === "shoe" ? "clothing" : "shoe";
                            handleSizeSubType(otherType, optionIndex);
                          }}
                        >
                          Switch to {currentSizeType === "shoe" ? "clothing" : "shoe"} sizes
                        </button>
                      </div>
                      <ToggleChips
                        allValues={currentSizeType === "shoe" ? SHOE_SIZES_EU : CLOTHING_SIZES}
                        selectedValues={option.values}
                        onToggle={(value) => handleToggleSizeValue(value, optionIndex)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Toggle sizes on/off. Only selected sizes will create variants.
                      </p>
                    </div>
                  )}

                  {/* Chip input for non-size options */}
                  {!isSizeOption && (
                    <div className="ml-8 space-y-2">
                      <Label className="text-xs text-muted-foreground">Values</Label>
                      <ChipTagInput
                        values={option.values.filter(Boolean)}
                        onAdd={(value) => handleChipAdd(optionIndex, value)}
                        onRemove={(valueIndex) => handleChipRemove(optionIndex, valueIndex)}
                        placeholder={
                          option.name.toLowerCase() === "color"
                            ? "Type a color and press Enter..."
                            : option.name.toLowerCase() === "material"
                            ? "Type a material and press Enter..."
                            : "Type a value and press Enter..."
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Preset quick-add buttons below existing options */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Quick add:</span>
              {!store.options.some((o) => o.name.toLowerCase() === "size") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handlePresetClick("size")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Size
                </Button>
              )}
              {!store.options.some((o) => o.name.toLowerCase() === "color") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handlePresetClick("color")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Color
                </Button>
              )}
              {!store.options.some((o) => o.name.toLowerCase() === "material") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handlePresetClick("material")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Material
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variant summary */}
      {variantSummary && variantSummary.total > 0 && (
        <>
          <Separator />

          <div className="space-y-4">
            {/* Summary banner */}
            <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {variantSummary.total} variant{variantSummary.total !== 1 ? "s" : ""} will be created
                </p>
                <p className="text-xs text-muted-foreground">{variantSummary.breakdown}</p>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Set all prices:</Label>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    £
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-7 h-8 text-sm"
                    onChange={(e) => store.setAllVariantPrices(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Set all quantities:</Label>
                <Input
                  type="number"
                  placeholder="1"
                  className="h-8 text-sm w-20"
                  onChange={(e) => store.setAllVariantQuantities(e.target.value)}
                />
              </div>
            </div>

            {/* Grouped pricing table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Variant</th>
                    <th className="text-left px-4 py-2 font-medium w-32">Price (£)</th>
                    <th className="text-left px-4 py-2 font-medium w-32">SKU</th>
                    <th className="text-left px-4 py-2 font-medium w-24">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groupedVariants.map((group) => (
                    <React.Fragment key={group.header ?? "__all"}>
                      {group.header && groupedVariants.length > 1 && (
                        <tr className="bg-muted/30">
                          <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.header}
                          </td>
                        </tr>
                      )}
                      {group.variants.map((variant) => (
                        <tr key={variant._idx} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium">
                            {getVariantDisplayName(variant.optionValues)}
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className={cn(
                                  "h-8 pl-5 text-sm",
                                  (!variant.price || parseFloat(variant.price) <= 0) && "border-red-400 focus-visible:ring-red-400"
                                )}
                                value={variant.price}
                                onChange={(e) =>
                                  store.updateVariantPrice(variant._idx, "price", e.target.value)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              placeholder="Auto"
                              className="h-8 text-sm"
                              value={variant.sku}
                              onChange={(e) =>
                                store.updateVariantPrice(variant._idx, "sku", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              className={cn(
                                "h-8 text-sm",
                                (!variant.quantity || parseInt(variant.quantity) <= 0) && "border-red-400 focus-visible:ring-red-400"
                              )}
                              value={variant.quantity}
                              onChange={(e) =>
                                store.updateVariantPrice(variant._idx, "quantity", e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              SKU and barcodes will be auto-generated if left empty.
            </p>
          </div>
        </>
      )}

      {/* Hint when options exist but no values yet */}
      {variantCombinations.length === 0 && store.options.length > 0 && store.options.some((o) => o.name) && (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Add option values above to generate variant combinations.
          </p>
        </div>
      )}
    </div>
  );
}

export function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Backend data (kept local — not form state)
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [collections, setCollections] = React.useState<ProductCollection[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);

  // --- Zustand store ---
  const store = useProductFormStore();

  const steps: Step[] = [
    { id: "details", label: "Details", status: store.currentStep === 0 ? "current" : store.currentStep > 0 ? "complete" : "upcoming" },
    { id: "organize", label: "Organize", status: store.currentStep === 1 ? "current" : store.currentStep > 1 ? "complete" : "upcoming" },
    { id: "variants", label: "Variants", status: store.currentStep === 2 ? "current" : "upcoming" },
  ];

  // Variant combinations — computed from store, no useEffect needed
  const variantCombinations = store.getVariantCombinations();

  // Fetch categories and collections on mount
  React.useEffect(() => {
    if (isOpen) {
      fetchBackendData();
    }
  }, [isOpen]);

  const fetchBackendData = async () => {
    setLoadingData(true);
    store.setError(null);
    try {
      const [categoriesRes, collectionsRes] = await Promise.allSettled([
        getCategories({ limit: 100 }),
        getCollections({ limit: 100 }),
      ]);

      if (categoriesRes.status === "fulfilled") {
        setCategories(categoriesRes.value.categories || []);
      } else {
        console.error("Failed to fetch categories:", categoriesRes.reason);
      }

      if (collectionsRes.status === "fulfilled") {
        setCollections(collectionsRes.value.collections || []);
      } else {
        console.error("Failed to fetch collections:", collectionsRes.reason);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleClose = () => {
    store.reset();
    setNewTag("");
    onClose();
  };

  const validateProduct = (): string | null => {
    if (!store.title.trim()) return "Product title is required.";
    if (!store.handle.trim()) return "Product handle is required.";

    if (store.hasVariants) {
      if (store.options.length === 0 || store.options.every(o => !o.name)) {
        return "Add at least one option (e.g., Size, Color).";
      }
      if (store.variantPrices.length === 0) {
        return "No variants generated. Add option values to create variants.";
      }
      for (let i = 0; i < store.variantPrices.length; i++) {
        const vp = store.variantPrices[i];
        const name = getVariantDisplayName(vp.optionValues);
        if (!vp.price || parseFloat(vp.price) <= 0) {
          return `Variant "${name}" needs a price greater than 0.`;
        }
        if (!vp.quantity || parseInt(vp.quantity) <= 0) {
          return `Variant "${name}" needs a quantity greater than 0.`;
        }
      }
    } else {
      if (!store.price || parseFloat(store.price) <= 0) {
        return "Product price is required and must be greater than 0.";
      }
      if (!store.quantity || parseInt(store.quantity) <= 0) {
        return "Product quantity is required and must be greater than 0.";
      }
    }
    return null;
  };

  const handleContinue = async () => {
    if (store.currentStep < steps.length - 1) {
      // Validate step 0 (Details)
      if (store.currentStep === 0 && !store.title.trim()) {
        store.setError("Product title is required.");
        return;
      }
      store.nextStep();
    } else {
      // Final step — validate everything before creating
      const error = validateProduct();
      if (error) {
        store.setError(error);
        return;
      }
      await saveProduct(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!store.title.trim()) {
      store.setError("Product title is required even for drafts.");
      return;
    }
    await saveProduct(true);
  };

  const saveProduct = async (isDraft: boolean) => {
    store.setSaving(true);
    store.setError(null);

    try {
      // Upload images to S3 first (non-blocking — product creation proceeds even if upload fails)
      let imageUrls: string[] = [];
      if (store.images.length > 0) {
        try {
          const uploadResults = await Promise.all(
            store.images.map((file) => uploadProductImage(file))
          );
          imageUrls = uploadResults.map((r) => r.url);
        } catch (uploadErr) {
          console.warn("Image upload failed, creating product without images:", uploadErr);
        }
      }
      // Build the product input
      const productInput: CreateProductInput = {
        title: store.title,
        description: store.description || undefined,
        handle: store.handle || store.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        status: isDraft ? "draft" : "published",
        images: imageUrls.length > 0 ? imageUrls : undefined,
        thumbnail: imageUrls.length > 0 ? imageUrls[0] : undefined,
        shippingProfileId: "default",
        categoryIds: store.category ? [store.category] : [],
        options: store.hasVariants
          ? store.options.filter(o => o.name && o.values.some(v => v)).map(o => ({
              title: o.name,
              values: o.values.filter(v => v),
            }))
          : [],
        variants: store.hasVariants
          ? store.variantPrices.map((vp) => ({
              title: getVariantDisplayName(vp.optionValues),
              sku: vp.sku || undefined,
              barcode: undefined,
              ean: undefined,
              inventoryQuantity: parseInt(vp.quantity) || (isDraft ? 1 : 0),
              manageInventory: true,
              allowBackorder: false,
              options: vp.optionValues,
              prices: [
                {
                  currencyCode: "GBP",
                  amount: parseFloat(vp.price) || (isDraft ? 0.01 : 0),
                },
              ],
            }))
          : [
              {
                title: store.title,
                sku: store.sku || undefined,
                barcode: store.barcode || undefined,
                ean: store.barcode || undefined,
                inventoryQuantity: parseInt(store.quantity) || (isDraft ? 1 : 0),
                manageInventory: store.trackQuantity,
                allowBackorder: false,
                options: {},
                prices: [
                  {
                    currencyCode: "GBP",
                    amount: parseFloat(store.price) || (isDraft ? 0.01 : 0),
                  },
                ],
              },
            ],
      };

      await createProduct(productInput);
      onSave?.(isDraft);
      handleClose();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Failed to create product");
      console.error("Failed to create product:", err);
    } finally {
      store.setSaving(false);
    }
  };

  // Handle file drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      store.addImages(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      store.addImages(newFiles);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-4 z-[100] mx-auto my-auto",
            "flex flex-col bg-background shadow-2xl rounded-lg",
            "max-w-6xl w-full max-h-[90vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          {/* Accessible title for screen readers */}
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>Create Product</DialogPrimitive.Title>
            <DialogPrimitive.Description>
              Multi-step form to create a new product
            </DialogPrimitive.Description>
          </VisuallyHidden.Root>

          {/* Header with tabs */}
          <div className="flex items-center border-b px-6 py-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="text-xs border rounded px-1.5 py-0.5 bg-muted">esc</span>
            </button>

            {/* Step tabs */}
            <div className="flex items-center ml-8 gap-0">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.status === "complete" || step.status === "current") {
                      store.goToStep(index);
                    }
                  }}
                  disabled={step.status === "upcoming"}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 border-b-2 transition-colors",
                    step.status === "current"
                      ? "border-primary text-foreground"
                      : step.status === "complete"
                      ? "border-transparent text-muted-foreground hover:text-foreground"
                      : "border-transparent text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      step.status === "complete"
                        ? "bg-primary text-primary-foreground"
                        : step.status === "current"
                        ? "border-2 border-primary text-primary"
                        : "border border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {step.status === "complete" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Circle className="h-2 w-2 fill-current" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Step 1: Details */}
              {store.currentStep === 0 && (
                <div className="space-y-8">
                  {/* General */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">General</h2>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Winter jacket"
                          value={store.title}
                          onChange={(e) => store.setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtitle" className="text-muted-foreground">
                          Subtitle <span className="text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="subtitle"
                          placeholder="Warm and cosy"
                          value={store.subtitle}
                          onChange={(e) => store.setField("subtitle", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="handle" className="flex items-center gap-1 text-muted-foreground">
                          Handle
                          <Info className="h-3 w-3" />
                          <span className="text-xs">(Optional)</span>
                        </Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                            /
                          </span>
                          <Input
                            id="handle"
                            placeholder="winter-jacket"
                            className="rounded-l-none"
                            value={store.handle}
                            onChange={(e) => store.setField("handle", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-muted-foreground">
                        Description <span className="text-xs">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="A warm and cozy jacket"
                        rows={4}
                        value={store.description}
                        onChange={(e) => store.setField("description", e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Media */}
                  <div className="space-y-4">
                    <Label className="text-muted-foreground">
                      Media <span className="text-xs">(Optional)</span>
                    </Label>

                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        "hover:border-muted-foreground/50"
                      )}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">Upload images</span>
                        <span className="text-sm text-muted-foreground">
                          Drag and drop images here or click to upload.
                        </span>
                      </button>
                    </div>

                    {store.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {store.images.map((file, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => store.removeImage(index)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {index === 0 && (
                              <Badge className="absolute bottom-2 left-2 text-xs">
                                Thumbnail
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Variants toggle */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Variants</h2>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <Switch
                        checked={store.hasVariants}
                        onCheckedChange={(checked) => store.setField("hasVariants", checked)}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">Yes, this is a product with variants</p>
                        <p className="text-sm text-muted-foreground">
                          When unchecked, we will create a default variant for you
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Organize */}
              {store.currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Organize Product</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Autocomplete
                          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                          value={store.category}
                          onValueChange={(value) => store.setField("category", value)}
                          placeholder="Select a category"
                          searchPlaceholder="Search categories..."
                          emptyMessage="No categories found."
                          disabled={loadingData}
                          loading={loadingData}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Collection</Label>
                        <Autocomplete
                          options={collections.map((col) => ({ value: col.id, label: col.title }))}
                          value={store.collection}
                          onValueChange={(value) => store.setField("collection", value)}
                          placeholder="Select a collection"
                          searchPlaceholder="Search collections..."
                          emptyMessage="No collections found."
                          disabled={loadingData}
                          loading={loadingData}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            store.addTag(newTag);
                            setNewTag("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          store.addTag(newTag);
                          setNewTag("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {store.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {store.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              onClick={() => store.removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {!store.hasVariants && (
                    <>
                      <Separator />

                      {/* Pricing for simple product */}
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Pricing</h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.price}
                                onChange={(e) => store.setField("price", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Compare at price <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.compareAtPrice}
                                onChange={(e) => store.setField("compareAtPrice", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Cost per item <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.costPerItem}
                                onChange={(e) => store.setField("costPerItem", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Inventory for simple product */}
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Inventory</h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              SKU <span className="text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                              placeholder="Auto-generated"
                              value={store.sku}
                              onChange={(e) => store.setField("sku", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Barcode (EAN-13) <span className="text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                              placeholder="Auto-generated"
                              value={store.barcode}
                              onChange={(e) => store.setField("barcode", e.target.value)}
                              maxLength={13}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={store.quantity}
                              onChange={(e) => store.setField("quantity", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Variants */}
              {store.currentStep === 2 && (
                <VariantStep store={store} variantCombinations={variantCombinations} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col border-t">
            {store.error && (
              <div className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 text-sm">
                <span>{store.error}</span>
                <button
                  onClick={() => store.setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                {store.currentStep > 0 && (
                  <Button type="button" variant="ghost" onClick={store.prevStep} disabled={store.saving}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={store.saving}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={store.saving}>
                  {store.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as draft"
                  )}
                </Button>
                <Button type="button" onClick={handleContinue} disabled={store.saving}>
                  {store.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : store.currentStep === steps.length - 1 ? (
                    "Create product"
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
