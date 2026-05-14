"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  Eye,
  Copy,
  Archive,
  Package,
  DollarSign,
  Tag,
  Layers,
  ImageIcon,
  AlertCircle,
  Loader2,
  X,
  Check,
  Star,
  GripVertical,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  validateVariantOptions,
  generateProductVariants,
  uploadProductImage,
  type Product,
  type ProductVariant,
  type ProductStatus,
  type UpdateProductInput,
  type Brand,
  getBrands,
  createBrand,
  type CreateVariantInput,
  type UpdateVariantInput,
  type VariantOptionValidationResponse,
  type CreateOptionInput,
  type UpdateOptionInput,
} from "@/lib/api";
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCategories,
  productKeys,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useAddOption,
  useUpdateOption,
  useDeleteOption,
  useAddProductImage,
  useDeleteProductImage,
  useReorderProductImages,
  useSetProductThumbnail,
} from "@/hooks/use-products";
import { useCollections } from "@/hooks/use-collections";
import { useQueryClient } from "@tanstack/react-query";
import { OptionWizard } from "@/components/products/OptionWizard";
import { ContextualHelpSidebar } from "@/components/products/ContextualHelpSidebar";

function getStatusBadge(status: ProductStatus) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300">Published</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-zinc-500/10 dark:text-zinc-300">Draft</Badge>;
    case "proposed":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-amber-500/10 dark:text-amber-300">Proposed</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

type VariantOptionValidationState =
  | { status: "idle"; message?: string }
  | { status: "checking"; message?: string }
  | { status: "valid"; message?: string }
  | { status: "incomplete"; message: string }
  | { status: "duplicate"; message: string; duplicateVariantId?: string; duplicateVariantTitle?: string }
  | { status: "invalid"; message: string };

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const queryClient = useQueryClient();

  // Data fetching via React Query
  const {
    data: product,
    isLoading: loading,
    error: productError,
    refetch: refetchProduct,
  } = useProduct(productId === "new" ? undefined : productId);

  const { data: categoriesData } = useCategories({ limit: 100 });
  const categories = categoriesData?.categories ?? [];

  const { data: collectionsData } = useCollections({ limit: 100 });
  const collections = collectionsData?.collections ?? [];

  const [brands, setBrands] = useState<Brand[]>([]);
  useEffect(() => {
    getBrands().then((res) => setBrands(res.brands)).catch(() => {});
  }, []);

  // Mutations
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Variant mutations
  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  // Option mutations
  const addOptionMutation = useAddOption();
  const updateOptionMutation = useUpdateOption();
  const deleteOptionMutation = useDeleteOption();

  // Image mutations
  const addProductImageMutation = useAddProductImage();
  const deleteProductImageMutation = useDeleteProductImage();
  const reorderProductImagesMutation = useReorderProductImages();
  const setProductThumbnailMutation = useSetProductThumbnail();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag and drop state for images
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Variant modal state
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantGenerating, setVariantGenerating] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [variantOptionValidation, setVariantOptionValidation] = useState<VariantOptionValidationState>({
    status: "idle",
  });

  // New variant form state
  const [variantForm, setVariantForm] = useState({
    title: "",
    sku: "",
    barcode: "",
    price: "",
    compareAtPrice: "",
    currencyCode: "GBP",
    inventoryQuantity: "",
    manageInventory: true,
    allowBackorder: false,
    weight: "",
    options: {} as Record<string, string>,
  });

  // Option modal state
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [showEditOptionModal, setShowEditOptionModal] = useState(false);
  const [useWizard, setUseWizard] = useState(true); // Use wizard by default
  const [editingOption, setEditingOption] = useState<{ id: string; title: string; values: string[] } | null>(null);
  const [optionError, setOptionError] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [optionForm, setOptionForm] = useState({
    title: "",
    values: "",
  });

  // Form state - all editable fields
  const [formData, setFormData] = useState({
    title: "",
    handle: "",
    subtitle: "",
    description: "",
    status: "draft" as ProductStatus,
    material: "",
    weight: "",
    originCountry: "",
    tags: [] as string[],
    categoryId: "",
    collectionId: "",
    brandId: "",
  });

  // New tag input
  const [newTag, setNewTag] = useState("");

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect "new" to the add product flow
  useEffect(() => {
    if (productId === "new") {
      router.replace("/products?action=add");
    }
  }, [productId, router]);

  // Sync form data when product loads or changes
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        handle: product.handle || "",
        subtitle: product.subtitle || "",
        description: product.description || "",
        status: product.status,
        material: product.material || "",
        weight: product.weight || "",
        originCountry: product.originCountry || "",
        tags: product.tags || [],
        categoryId: product.categories?.[0] || "",
        collectionId: product.collectionId || "",
        brandId: product.brandId || "",
      });
      setHasChanges(false);
    }
  }, [product]);

  // Derive saving states from mutations
  const variantSaving = createVariantMutation.isPending || updateVariantMutation.isPending;
  const optionSaving = addOptionMutation.isPending || updateOptionMutation.isPending;
  const reordering = reorderProductImagesMutation.isPending || setProductThumbnailMutation.isPending;

  // Calculate total possible variant combinations
  const calculatePossibleVariants = (product: Product) => {
    if (!product.options || product.options.length === 0) return 1;
    return product.options.reduce((total, option) => total * (option.values?.length || 1), 1);
  };

  const normalizeOptionValue = (value: string | undefined) => value?.trim().toLowerCase() || "";

  const variantCombinationKey = (
    options: Product["options"],
    values: Record<string, string | undefined>
  ) =>
    options
      .map((option) => `${option.title}:${normalizeOptionValue(values[option.title])}`)
      .join("|");

  const getMissingVariantCombinationCount = (product: Product) => {
    const validOptions = product.options.filter((option) => option.values.length > 0);
    if (validOptions.length === 0) return 0;

    const expectedKeys = validOptions
      .reduce<Array<Record<string, string>>>(
        (combinations, option) =>
          combinations.flatMap((combination) =>
            option.values.map((value) => ({
              ...combination,
              [option.title]: value,
            }))
          ),
        [{}]
      )
      .map((combination) => variantCombinationKey(validOptions, combination));

    const createdKeys = new Set(
      product.variants
        .filter((variant) =>
          validOptions.every((option) => normalizeOptionValue(variant.options?.[option.title]))
        )
        .map((variant) => variantCombinationKey(validOptions, variant.options))
    );

    return expectedKeys.filter((key) => !createdKeys.has(key)).length;
  };

  const currentVariantOptionValues = () => {
    if (!product) return {};

    return product.options.reduce<Record<string, string>>((acc, option) => {
      const value = variantForm.options[option.title]?.trim();
      if (value) acc[option.title] = value;
      return acc;
    }, {});
  };

  const localVariantOptionValidation = (
    optionValues: Record<string, string>,
    variantId?: string
  ): VariantOptionValidationState => {
    if (!product || product.options.length === 0) return { status: "idle" };

    const missingOptions = product.options
      .filter((option) => !optionValues[option.title]?.trim())
      .map((option) => option.title);

    if (missingOptions.length > 0) {
      return {
        status: "incomplete",
        message: `Select a value for ${missingOptions.join(", ")}`,
      };
    }

    const invalidOption = product.options.find((option) => {
      const value = optionValues[option.title]?.trim();
      return value && option.values.length > 0 && !option.values.includes(value);
    });

    if (invalidOption) {
      return {
        status: "invalid",
        message: `${invalidOption.title} value is not configured for this product`,
      };
    }

    const duplicate = product.variants.find((variant) => {
      if (variant.id === variantId) return false;
      return product.options.every(
        (option) => normalizeOptionValue(variant.options?.[option.title]) === normalizeOptionValue(optionValues[option.title])
      );
    });

    if (duplicate) {
      return {
        status: "duplicate",
        message: `This combination already exists as variant "${duplicate.title}"`,
        duplicateVariantId: duplicate.id,
        duplicateVariantTitle: duplicate.title,
      };
    }

    return { status: "valid", message: "Combination is available" };
  };

  const applyBackendVariantOptionValidation = (result: VariantOptionValidationResponse) => {
    if (result.valid) {
      setVariantOptionValidation({ status: "valid", message: "Combination is available" });
      return;
    }

    if (result.status === "DUPLICATE") {
      setVariantOptionValidation({
        status: "duplicate",
        message: result.message || "This option combination already exists",
        duplicateVariantId: result.duplicateVariantId,
        duplicateVariantTitle: result.duplicateVariantTitle,
      });
      return;
    }

    setVariantOptionValidation({
      status: result.status === "INCOMPLETE" ? "incomplete" : "invalid",
      message: result.message || "This option combination is not valid",
    });
  };

  useEffect(() => {
    const modalOpen = showAddVariantModal || showEditVariantModal;

    if (!modalOpen || !product || product.options.length === 0) {
      setVariantOptionValidation({ status: "idle" });
      return;
    }

    const optionValues = currentVariantOptionValues();
    const variantId = showEditVariantModal ? editingVariant?.id : undefined;
    const localResult = localVariantOptionValidation(optionValues, variantId);
    setVariantOptionValidation(localResult);

    if (localResult.status !== "valid") return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setVariantOptionValidation({ status: "checking", message: "Checking combination..." });
      validateVariantOptions(product.id, optionValues, variantId, controller.signal)
        .then(applyBackendVariantOptionValidation)
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setVariantOptionValidation({
            status: "invalid",
            message: "Could not validate this combination. Saving will run the final check.",
          });
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    showAddVariantModal,
    showEditVariantModal,
    product,
    editingVariant?.id,
    variantForm.options,
  ]);

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!product) return;
    setError(null);
    setSuccess(null);

    const updateData: UpdateProductInput = {
      title: formData.title,
      handle: formData.handle,
      subtitle: formData.subtitle || undefined,
      description: formData.description || undefined,
      status: formData.status,
      material: formData.material || undefined,
      originCountry: formData.originCountry || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      categories: formData.categoryId ? [formData.categoryId] : undefined,
      collectionId: formData.collectionId || undefined,
      brandId: formData.brandId || undefined,
    };

    updateProductMutation.mutate(
      { id: product.id, data: updateData },
      {
        onSuccess: () => {
          setSuccess("Product saved successfully");
          setHasChanges(false);
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to save product");
        },
      }
    );
  };

  const saving = updateProductMutation.isPending;

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = await confirm({
      title: "Delete Product",
      description: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;
    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        router.push("/products");
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to delete product");
      },
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField("tags", formData.tags.filter((t) => t !== tagToRemove));
  };

  // Variant handlers
  const resetVariantForm = () => {
    setVariantForm({
      title: "",
      sku: "",
      barcode: "",
      price: "",
      compareAtPrice: "",
      currencyCode: "GBP",
      inventoryQuantity: "",
      manageInventory: true,
      allowBackorder: false,
      weight: "",
      options: {},
    });
    setVariantError(null);
    setVariantOptionValidation({ status: "idle" });
  };

  const openAddVariantModal = () => {
    const defaultOptions =
      product?.options.reduce<Record<string, string>>((acc, option) => {
        acc[option.title] = option.values[0] || "";
        return acc;
      }, {}) ?? {};

    setVariantForm({
      title: "",
      sku: "",
      barcode: "",
      price: "",
      compareAtPrice: "",
      currencyCode: "GBP",
      inventoryQuantity: "",
      manageInventory: true,
      allowBackorder: false,
      weight: "",
      options: defaultOptions,
    });
    setVariantError(null);
    setVariantOptionValidation({ status: "idle" });
    setShowAddVariantModal(true);
  };

  const openEditVariantModal = (variant: ProductVariant) => {
    setEditingVariant(variant);
    const mainPrice = variant.prices[0];
    setVariantForm({
      title: variant.title,
      sku: variant.sku || "",
      barcode: variant.barcode || "",
      price: mainPrice?.amount?.toString() || "",
      compareAtPrice: mainPrice?.compareAtPrice?.toString() || "",
      currencyCode: mainPrice?.currencyCode || "GBP",
      inventoryQuantity: variant.inventoryQuantity?.toString() || "",
      manageInventory: variant.manageInventory,
      allowBackorder: variant.allowBackorder,
      weight: variant.weight || "",
      options: variant.options || {},
    });
    setVariantError(null);
    setVariantOptionValidation({ status: "idle" });
    setShowEditVariantModal(true);
  };

  const handleAddVariant = () => {
    if (!product || !variantForm.title.trim()) {
      setVariantError("Title is required");
      return;
    }

    const optionValues = product.options.reduce<Record<string, string>>((acc, option) => {
      const value = variantForm.options[option.title]?.trim();
      if (value) acc[option.title] = value;
      return acc;
    }, {});

    if (product.options.length > 0 && Object.keys(optionValues).length !== product.options.length) {
      setVariantError("Select a value for every product option");
      return;
    }

    setVariantError(null);

    const input: CreateVariantInput = {
      title: variantForm.title.trim(),
      sku: variantForm.sku || undefined,
      barcode: variantForm.barcode || undefined,
      manageInventory: variantForm.manageInventory,
      allowBackorder: variantForm.allowBackorder,
      inventoryQuantity: variantForm.inventoryQuantity
        ? parseInt(variantForm.inventoryQuantity, 10)
        : undefined,
      weight: variantForm.weight || undefined,
      prices: variantForm.price
        ? [
            {
              currencyCode: variantForm.currencyCode,
              amount: parseFloat(variantForm.price),
              compareAtPrice: variantForm.compareAtPrice
                ? parseFloat(variantForm.compareAtPrice)
                : undefined,
            },
          ]
        : undefined,
      options: Object.keys(optionValues).length > 0 ? optionValues : undefined,
    };

    createVariantMutation.mutate(
      { productId: product.id, data: input },
      {
        onSuccess: () => {
          setShowAddVariantModal(false);
          resetVariantForm();
          setSuccess("Variant added successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setVariantError(err instanceof Error ? err.message : "Failed to add variant");
        },
      }
    );
  };

  const handleUpdateVariant = () => {
    if (!product || !editingVariant || !variantForm.title.trim()) {
      setVariantError("Title is required");
      return;
    }

    const optionValues = product.options.reduce<Record<string, string>>((acc, option) => {
      const value = variantForm.options[option.title]?.trim();
      if (value) acc[option.title] = value;
      return acc;
    }, {});

    if (product.options.length > 0 && Object.keys(optionValues).length !== product.options.length) {
      setVariantError("Select a value for every product option");
      return;
    }

    setVariantError(null);

    const input: UpdateVariantInput = {
      title: variantForm.title.trim(),
      sku: variantForm.sku || undefined,
      barcode: variantForm.barcode || undefined,
      manageInventory: variantForm.manageInventory,
      allowBackorder: variantForm.allowBackorder,
      inventoryQuantity: variantForm.inventoryQuantity
        ? parseInt(variantForm.inventoryQuantity, 10)
        : undefined,
      weight: variantForm.weight || undefined,
      prices: [
        {
          currencyCode: variantForm.currencyCode,
          amount: parseFloat(variantForm.price) || 0,
          compareAtPrice: variantForm.compareAtPrice
            ? parseFloat(variantForm.compareAtPrice)
            : undefined,
        },
      ],
      options: Object.keys(optionValues).length > 0 ? optionValues : undefined,
    };

    updateVariantMutation.mutate(
      { variantId: editingVariant.id, data: input, productId: product.id },
      {
        onSuccess: () => {
          setShowEditVariantModal(false);
          setEditingVariant(null);
          resetVariantForm();
          setSuccess("Variant updated successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setVariantError(err instanceof Error ? err.message : "Failed to update variant");
        },
      }
    );
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return;

    const confirmed = await confirm({
      title: "Delete Variant",
      description: "Are you sure you want to delete this variant? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;

    deleteVariantMutation.mutate(
      { variantId, productId: product.id },
      {
        onSuccess: () => {
          setSuccess("Variant deleted successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to delete variant");
        },
      }
    );
  };

  const handleGenerateVariants = async () => {
    if (!product) return;
    setVariantGenerating(true);
    setError(null);

    try {
      const result = await generateProductVariants(product.id);
      setSuccess(
        result.generated > 0
          ? `Generated ${result.generated} missing variant${result.generated === 1 ? "" : "s"}`
          : "All option combinations already have variants"
      );
      refetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate variants");
    } finally {
      setVariantGenerating(false);
    }
  };

  // Option handlers
  const resetOptionForm = () => {
    setOptionForm({ title: "", values: "" });
    setOptionError(null);
  };

  const openAddOptionModal = () => {
    resetOptionForm();
    setShowAddOptionModal(true);
  };

  const openEditOptionModal = (option: { id: string; title: string; values: string[] }) => {
    setEditingOption(option);
    setOptionForm({
      title: option.title,
      values: option.values.join(", "),
    });
    setOptionError(null);
    setShowEditOptionModal(true);
  };

  const handleAddOption = () => {
    if (!product || !optionForm.title.trim()) {
      setOptionError("Title is required");
      return;
    }
    if (!optionForm.values.trim()) {
      setOptionError("At least one value is required");
      return;
    }

    const values = optionForm.values.split(",").map((v) => v.trim()).filter(Boolean);

    // Warn about single-value options (usually a mistake)
    if (values.length === 1) {
      setOptionError("Options should have multiple values. Did you mean to create a variant instead? Example: For sizes, enter 'S, M, L, XL' not just '54'");
      return;
    }

    setOptionError(null);

    const input: CreateOptionInput = {
      title: optionForm.title.trim(),
      values,
    };

    addOptionMutation.mutate(
      { productId: product.id, data: input },
      {
        onSuccess: () => {
          setShowAddOptionModal(false);
          resetOptionForm();
          setSuccess("Option added successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setOptionError(err instanceof Error ? err.message : "Failed to add option");
        },
      }
    );
  };

  const handleUpdateOption = () => {
    if (!product || !editingOption || !optionForm.title.trim()) {
      setOptionError("Title is required");
      return;
    }
    setOptionError(null);

    const values = optionForm.values.split(",").map((v) => v.trim()).filter(Boolean);
    const input: UpdateOptionInput = {
      title: optionForm.title.trim(),
      values: values.length > 0 ? values : undefined,
    };

    updateOptionMutation.mutate(
      { productId: product.id, optionId: editingOption.id, data: input },
      {
        onSuccess: () => {
          setShowEditOptionModal(false);
          setEditingOption(null);
          resetOptionForm();
          setSuccess("Option updated successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setOptionError(err instanceof Error ? err.message : "Failed to update option");
        },
      }
    );
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!product) return;

    const confirmed = await confirm({
      title: "Delete Option",
      description: "Are you sure you want to delete this option? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;

    deleteOptionMutation.mutate(
      { productId: product.id, optionId },
      {
        onSuccess: () => {
          setSuccess("Option deleted successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to delete option");
        },
      }
    );
  };

  // Wizard completion handler
  const handleWizardComplete = (options: Array<{ title: string; values: string[] }>) => {
    if (!product) return;

    // Add all options sequentially
    let successCount = 0;
    const totalOptions = options.length;

    options.forEach((option, index) => {
      const input: CreateOptionInput = {
        title: option.title.trim(),
        values: option.values,
      };

      addOptionMutation.mutate(
        { productId: product.id, data: input },
        {
          onSuccess: () => {
            successCount++;
            if (successCount === totalOptions) {
              setShowAddOptionModal(false);
              setSuccess(`${totalOptions} option${totalOptions > 1 ? 's' : ''} added successfully`);
              setTimeout(() => setSuccess(null), 3000);
            }
          },
          onError: (err) => {
            setOptionError(err instanceof Error ? err.message : `Failed to add option: ${option.title}`);
          },
        }
      );
    });
  };

  // Image handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 25MB for high-resolution images)
    if (file.size > 25 * 1024 * 1024) {
      setError("Image must be less than 25MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Upload to storage (MinIO/S3) - backend saves to product if productId provided
      const uploadResult = await uploadProductImage(file, product.id);

      // Only add image separately if backend didn't save it to product
      if (!uploadResult.savedToProduct) {
        addProductImageMutation.mutate(
          {
            productId: product.id,
            data: {
              url: uploadResult.url,
              position: product.images.length,
            },
          },
          {
            onSuccess: () => {
              setSuccess("Image uploaded successfully");
              setTimeout(() => setSuccess(null), 3000);
            },
            onError: (imgErr) => {
              setError(imgErr instanceof Error ? imgErr.message : "Failed to add image to product");
            },
          }
        );
      } else {
        setSuccess("Image uploaded successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return;

    const confirmed = await confirm({
      title: "Delete Image",
      description: "Are you sure you want to delete this image? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;

    deleteProductImageMutation.mutate(
      { productId: product.id, imageId },
      {
        onSuccess: () => {
          setSuccess("Image deleted successfully");
          setSelectedImage(0); // Reset to first image
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to delete image");
        },
      }
    );
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || !product || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    // Create new order by moving dragged item to drop position
    const newImages = [...product.images];
    const [draggedImage] = newImages.splice(draggedImageIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Send new order to backend
    const imageIds = newImages.map((img) => img.id);

    reorderProductImagesMutation.mutate(
      { productId: product.id, imageIds },
      {
        onSuccess: () => {
          setSuccess("Images reordered successfully");
          setSelectedImage(0); // Reset to first image (new thumbnail)
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to reorder images");
        },
        onSettled: () => {
          setDraggedImageIndex(null);
        },
      }
    );
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // Set image as thumbnail
  const handleSetThumbnail = (imageId: string) => {
    if (!product) return;

    setProductThumbnailMutation.mutate(
      { productId: product.id, imageId },
      {
        onSuccess: () => {
          setSuccess("Thumbnail updated successfully");
          setTimeout(() => setSuccess(null), 3000);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to set thumbnail");
        },
      }
    );
  };

  // Get first variant price for display
  const getMainPrice = () => {
    if (!product?.variants?.[0]?.prices?.[0]) return null;
    return product.variants[0].prices[0];
  };

  const renderVariantOptionValidation = () => {
    if (variantOptionValidation.status === "idle") return null;

    const tone =
      variantOptionValidation.status === "valid"
        ? "border-green-200 bg-green-50 text-green-700"
        : variantOptionValidation.status === "checking"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-red-200 bg-red-50 text-red-700";

    const icon =
      variantOptionValidation.status === "valid" ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
      ) : variantOptionValidation.status === "checking" ? (
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      );

    return (
      <div className={`flex gap-2 rounded-md border px-3 py-2 text-xs ${tone}`}>
        {icon}
        <div>
          <p>{variantOptionValidation.message}</p>
          {variantOptionValidation.status === "duplicate" && variantOptionValidation.duplicateVariantId && (
            <button
              type="button"
              className="mt-1 underline"
              onClick={() => {
                const duplicate = product?.variants.find((variant) => variant.id === variantOptionValidation.duplicateVariantId);
                if (duplicate) openEditVariantModal(duplicate);
              }}
            >
              Open existing variant
            </button>
          )}
        </div>
      </div>
    );
  };

  // Defined in @/lib/utils — imported at top

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const queryError = productError instanceof Error ? productError.message : productError ? "Failed to load product" : null;

  if ((queryError || error) && !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load product</h2>
        <p className="text-muted-foreground">{queryError || error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
          <Button onClick={() => refetchProduct()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const mainPrice = getMainPrice();
  const thumbnailUrl = getImageUrl(product.thumbnail) || getImageUrl(product.images[0]?.url);
  const possibleVariantCount = calculatePossibleVariants(product);
  const missingVariantCombinationCount = getMissingVariantCombinationCount(product);
  const createdVariantCombinationCount = possibleVariantCount - missingVariantCombinationCount;
  const hasOptionVariantMismatch = missingVariantCombinationCount > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {confirmDialog}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{product.title}</h1>
              {getStatusBadge(product.status)}
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.id.slice(0, 8)} · Last updated {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://gumite.com";
              const handle = product?.handle || formData.handle;
              if (handle) {
                window.open(`${storefrontUrl}/products/${handle}`, "_blank");
              } else {
                toast.error("Product handle is missing — save the product first");
              }
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Duplicate feature coming soon")}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Archive Product",
                    description: "Are you sure you want to archive this product? It will be marked as draft.",
                    confirmLabel: "Archive",
                  });
                  if (!confirmed) return;
                  updateField("status", "draft" as ProductStatus);
                  toast.info("Product marked as draft. Save to apply.");
                }}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Product
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) => updateField("handle", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="Optional short description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select
                    value={formData.brandId}
                    onValueChange={(value) => updateField("brandId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => updateField("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection">Collection</Label>
                  <Select
                    value={formData.collectionId}
                    onValueChange={(value) => updateField("collectionId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => updateField("material", e.target.value)}
                    placeholder="e.g., Leather, Cotton"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media
              </CardTitle>
              <CardDescription>
                Drag and drop to reorder images. First image is the thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Main Image */}
                {thumbnailUrl ? (
                  <div className="relative aspect-square max-w-md overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        product.images[selectedImage]
                          ? getImageUrl(product.images[selectedImage].url) || ""
                          : thumbnailUrl
                      }
                      alt={product.images[selectedImage]?.altText || product.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Show placeholder icon instead of broken image
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          e.currentTarget.style.display = "none";
                          parent.classList.add("flex", "items-center", "justify-center");
                          const placeholder = document.createElement("div");
                          placeholder.className = "text-center text-muted-foreground";
                          placeholder.innerHTML = '<svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg><p class="text-xs">Image failed to load</p>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square max-w-md items-center justify-center rounded-lg border bg-muted">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No images</p>
                    </div>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload product image"
                />
                {/* Thumbnails - Drag to reorder */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => {
                    const imgUrl = getImageUrl(image.url);
                    const isThumbnail = product.thumbnail === image.url;
                    const isDragging = draggedImageIndex === index;
                    return (
                      <div
                        key={image.id}
                        draggable={!reordering}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 cursor-grab active:cursor-grabbing transition-all ${
                          selectedImage === index ? "border-primary" : "border-transparent"
                        } ${isDragging ? "opacity-50 scale-95" : ""} ${reordering ? "pointer-events-none" : ""}`}
                      >
                        {/* Drag handle indicator */}
                        <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <GripVertical className="h-3 w-3 text-white" />
                        </div>
                        {/* Thumbnail badge */}
                        {isThumbnail && (
                          <div className="absolute top-1 left-1 z-10">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedImage(index)}
                          className="h-full w-full"
                        >
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgUrl}
                              alt={image.altText || `Image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                        {/* Action buttons overlay */}
                        <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {/* Set as thumbnail button */}
                          {!isThumbnail && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetThumbnail(image.id);
                              }}
                              disabled={reordering}
                              className="h-5 w-5 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 disabled:opacity-50"
                              title="Set as thumbnail"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          {isThumbnail && <div />}
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                            disabled={reordering}
                            className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                            title="Delete image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || reordering}
                    aria-label="Upload product image"
                    className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed hover:border-primary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage || reordering ? (
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>
                Prices are managed per variant. Edit variants to change pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      value={mainPrice?.amount || 0}
                      className="pl-7 bg-muted"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Compare at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      value={mainPrice?.compareAtPrice || ""}
                      className="pl-7 bg-muted"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={mainPrice?.currencyCode || "GBP"} disabled className="bg-muted" />
                </div>
              </div>
              {mainPrice && mainPrice.compareAtPrice && mainPrice.compareAtPrice > mainPrice.amount && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      £{(mainPrice.compareAtPrice - mainPrice.amount).toFixed(2)} ({Math.round(((mainPrice.compareAtPrice - mainPrice.amount) / mainPrice.compareAtPrice) * 100)}% off)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants (Shopify-style) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Variants
              </CardTitle>
              <CardDescription>
                This product {product.options.length === 0 ? "has a single variant" : `comes in ${product.options.length} option${product.options.length > 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Options Section - Primary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Options</Label>
                  {product.options.length === 0 && (
                    <Button size="sm" variant="outline" onClick={openAddOptionModal}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add options like size or color
                    </Button>
                  )}
                </div>

                {product.options.length > 0 && (
                  <div className="space-y-3">
                    {product.options.map((option) => (
                      <div key={option.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">{option.title}</Label>
                              <Badge variant="secondary" className="text-xs">{option.values.length} values</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditOptionModal(option)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteOption(option.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {option.values.map((value) => (
                            <Badge key={value} variant="outline" className="font-normal">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={openAddOptionModal}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add another option
                    </Button>
                  </div>
                )}

                {product.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add options if this product comes in multiple versions, like different sizes or colors.
                  </p>
                )}
              </div>

              {product.options.length > 0 && <Separator />}

              {/* Variants Section */}
              {product.options.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Preview</Label>
                      {hasOptionVariantMismatch && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          {createdVariantCombinationCount} of {possibleVariantCount} variants created
                        </Badge>
                      )}
                    </div>
                    {hasOptionVariantMismatch && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateVariants}
                        disabled={variantGenerating}
                      >
                        {variantGenerating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Generate {missingVariantCombinationCount} missing variant{missingVariantCombinationCount === 1 ? "" : "s"}
                      </Button>
                    )}
                  </div>

                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Variant</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.variants.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center">
                              <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                                <Package className="h-8 w-8" />
                                <div>
                                  <p className="font-medium text-foreground">No purchasable variants created yet</p>
                                  <p>
                                    Generate variants from the option values above so customers can select them and add this product to bag.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={handleGenerateVariants}
                                  disabled={variantGenerating || !hasOptionVariantMismatch}
                                >
                                  {variantGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Copy className="mr-2 h-4 w-4" />
                                  )}
                                  Generate variants
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {product.variants.map((variant) => (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <div className="font-medium">{variant.title}</div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.prices[0]?.amount || ""}
                                className="w-24 h-8"
                                placeholder="0.00"
                                disabled
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={variant.inventoryQuantity ?? ""}
                                className="w-20 h-8"
                                disabled={!variant.manageInventory}
                                placeholder={variant.manageInventory ? "0" : "∞"}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={variant.sku || ""}
                                className="w-32 h-8 font-mono text-xs"
                                placeholder="SKU"
                                disabled
                              />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditVariantModal(variant)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteVariant(variant.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value as ProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.categoryId ? (
                    <Badge variant="secondary">
                      {categories.find((c) => c.id === formData.categoryId)?.name || formData.categoryId}
                    </Badge>
                  ) : product.categories.length > 0 ? (
                    product.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {categories.find((c) => c.id === category)?.name || category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="pr-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={product.variants[0]?.sku || ""}
                    disabled
                    className="bg-muted font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input
                    value={product.variants[0]?.barcode || ""}
                    disabled
                    className="bg-muted font-mono text-sm"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Variants</span>
                  <span className="font-medium">
                    {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="e.g., 0.5 kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originCountry">Origin Country</Label>
                  <Input
                    id="originCountry"
                    value={formData.originCountry}
                    onChange={(e) => updateField("originCountry", e.target.value)}
                    placeholder="e.g., GB"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Variant Modal */}
      <Dialog open={showAddVariantModal} onOpenChange={setShowAddVariantModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Variant</DialogTitle>
            <DialogDescription>
              Add a new variant to this product with pricing and inventory settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {variantError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {variantError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="variant-title">Title *</Label>
              <Input
                id="variant-title"
                value={variantForm.title}
                onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                placeholder="e.g., Small / Black"
              />
            </div>
            {product.options.length > 0 && (
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label>Option values *</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These values connect this variant to the product options used by the storefront.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.options.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <Label>{option.title}</Label>
                      {option.values.length > 0 ? (
                        <Select
                          value={variantForm.options[option.title] || ""}
                          onValueChange={(value) =>
                            setVariantForm({
                              ...variantForm,
                              options: { ...variantForm.options, [option.title]: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${option.title}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {option.values.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={variantForm.options[option.title] || ""}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              options: { ...variantForm.options, [option.title]: e.target.value },
                            })
                          }
                          placeholder={`Enter ${option.title}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {renderVariantOptionValidation()}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU</Label>
                <Input
                  id="variant-sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-barcode">Barcode</Label>
                <Input
                  id="variant-barcode"
                  value={variantForm.barcode}
                  onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="variant-price"
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-compare">Compare at</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="variant-compare"
                    type="number"
                    step="0.01"
                    value={variantForm.compareAtPrice}
                    onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-currency">Currency</Label>
                <Select
                  value={variantForm.currencyCode}
                  onValueChange={(value) => setVariantForm({ ...variantForm, currencyCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-weight">Weight</Label>
                <Input
                  id="variant-weight"
                  value={variantForm.weight}
                  onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                  placeholder="e.g., 0.5 kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-quantity">Quantity</Label>
                <Input
                  id="variant-quantity"
                  type="number"
                  min="0"
                  value={variantForm.inventoryQuantity}
                  onChange={(e) => setVariantForm({ ...variantForm, inventoryQuantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.manageInventory}
                  onChange={(e) => setVariantForm({ ...variantForm, manageInventory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Track inventory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.allowBackorder}
                  onChange={(e) => setVariantForm({ ...variantForm, allowBackorder: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow backorder</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariantModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVariant} disabled={variantSaving}>
              {variantSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Modal */}
      <Dialog open={showEditVariantModal} onOpenChange={setShowEditVariantModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <DialogDescription>
              Update variant details and pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {variantError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {variantError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-variant-title">Title *</Label>
              <Input
                id="edit-variant-title"
                value={variantForm.title}
                onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                placeholder="e.g., Small / Black"
              />
            </div>
            {product.options.length > 0 && (
              <div className="space-y-3 rounded-md border p-3">
                <div>
                  <Label>Option values *</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These values assign this variant to the storefront option choices.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.options.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <Label>{option.title}</Label>
                      {option.values.length > 0 ? (
                        <Select
                          value={variantForm.options[option.title] || ""}
                          onValueChange={(value) =>
                            setVariantForm({
                              ...variantForm,
                              options: { ...variantForm.options, [option.title]: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${option.title}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {option.values.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={variantForm.options[option.title] || ""}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              options: { ...variantForm.options, [option.title]: e.target.value },
                            })
                          }
                          placeholder={`Enter ${option.title}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {renderVariantOptionValidation()}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-variant-sku">SKU</Label>
                <Input
                  id="edit-variant-sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-barcode">Barcode</Label>
                <Input
                  id="edit-variant-barcode"
                  value={variantForm.barcode}
                  onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-variant-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="edit-variant-price"
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-compare">Compare at</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="edit-variant-compare"
                    type="number"
                    step="0.01"
                    value={variantForm.compareAtPrice}
                    onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-currency">Currency</Label>
                <Select
                  value={variantForm.currencyCode}
                  onValueChange={(value) => setVariantForm({ ...variantForm, currencyCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-variant-weight">Weight</Label>
                <Input
                  id="edit-variant-weight"
                  value={variantForm.weight}
                  onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                  placeholder="e.g., 0.5 kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-quantity">Quantity</Label>
                <Input
                  id="edit-variant-quantity"
                  type="number"
                  min="0"
                  value={variantForm.inventoryQuantity}
                  onChange={(e) => setVariantForm({ ...variantForm, inventoryQuantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.manageInventory}
                  onChange={(e) => setVariantForm({ ...variantForm, manageInventory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Track inventory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.allowBackorder}
                  onChange={(e) => setVariantForm({ ...variantForm, allowBackorder: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow backorder</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditVariantModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVariant} disabled={variantSaving}>
              {variantSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Option Modal - Wizard or Advanced */}
      <Dialog open={showAddOptionModal} onOpenChange={(open) => {
        setShowAddOptionModal(open);
        if (!open) {
          // Reset wizard mode when closing
          setUseWizard(true);
          resetOptionForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          {useWizard ? (
            <OptionWizard
              onComplete={handleWizardComplete}
              onCancel={() => {
                setShowAddOptionModal(false);
                setUseWizard(true);
                resetOptionForm();
              }}
              existingOptions={product?.options?.map(opt => ({ title: opt.title, values: opt.values })) || []}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Option (Advanced Mode)</DialogTitle>
                <DialogDescription>
                  Options define product variations. Each option can have multiple values.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Guidance Card */}
                <div className="rounded-lg border bg-blue-50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-xs text-blue-900 space-y-1">
                      <p className="font-medium">How options work:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                        <li><strong>Option Name</strong> is the category (e.g., "Size", "Color")</li>
                        <li><strong>Values</strong> are ALL the choices for that category</li>
                        <li>Example: Option "Size" with values "S, M, L, XL"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {optionError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {optionError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="option-title">Option Name *</Label>
                  <Input
                    id="option-title"
                    value={optionForm.title}
                    onChange={(e) => setOptionForm({ ...optionForm, title: e.target.value })}
                    placeholder="Size"
                  />
                  <p className="text-xs text-muted-foreground">
                    Common names: Size, Color, Material, Style
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option-values">Values * (comma-separated)</Label>
                  <Input
                    id="option-values"
                    value={optionForm.values}
                    onChange={(e) => setOptionForm({ ...optionForm, values: e.target.value })}
                    placeholder="S, M, L, XL"
                  />
                  <p className="text-xs text-muted-foreground">
                    List ALL values for this option. For sizes: "54, 56, 58, 60, S, M, L, XL"
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddOptionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddOption} disabled={optionSaving}>
                  {optionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Option
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Option Modal */}
      <Dialog open={showEditOptionModal} onOpenChange={setShowEditOptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
            <DialogDescription>
              Update option name and values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {optionError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {optionError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-option-title">Option Name *</Label>
              <Input
                id="edit-option-title"
                value={optionForm.title}
                onChange={(e) => setOptionForm({ ...optionForm, title: e.target.value })}
                placeholder="e.g., Size, Color, Material"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-option-values">Values</Label>
              <Input
                id="edit-option-values"
                value={optionForm.values}
                onChange={(e) => setOptionForm({ ...optionForm, values: e.target.value })}
                placeholder="e.g., Small, Medium, Large (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Enter values separated by commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditOptionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOption} disabled={optionSaving}>
              {optionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
