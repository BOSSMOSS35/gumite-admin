"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  Upload,
  Plus,
  Search,
  Package,
  X,
} from "lucide-react";
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
  useUploadCollectionImage,
  useAddProductsToCollection,
  useRemoveProductsFromCollection,
} from "@/hooks/use-collections";
import {
  getProducts,
  type CollectionProduct,
  type ProductSummary,
} from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  // React Query
  const { data, isLoading, error: queryError } = useCollection(collectionId);
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();
  const uploadImageMutation = useUploadCollectionImage();
  const addProductsMutation = useAddProductsToCollection();
  const removeProductsMutation = useRemoveProductsFromCollection();

  const collection = data?.collection ?? null;

  // Local UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    title: "",
    handle: "",
  });

  // Add products modal
  const [addProductsModalOpen, setAddProductsModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [showOnlyNewProducts, setShowOnlyNewProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [removingProduct, setRemovingProduct] = useState<string | null>(null);
  const [confirmRemoveProduct, setConfirmRemoveProduct] = useState<CollectionProduct | null>(null);

  const NEW_PRODUCT_DAYS = 7;
  const NEW_PRODUCT_MS = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
  const PRODUCT_FETCH_BATCH_SIZE = 100;

  // Sync edit form when collection loads (only when opening the modal)
  const openEditModal = () => {
    if (collection) {
      setEditForm({
        title: collection.title,
        handle: collection.handle,
      });
    }
    setEditModalOpen(true);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Handle copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveEdit = async () => {
    if (!collection) return;

    setError(null);

    try {
      const response = await updateMutation.mutateAsync({
        id: collection.id,
        data: {
          title: editForm.title,
          handle: editForm.handle,
        },
      });
      setSuccess("Collection updated successfully");
      setEditModalOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update collection");
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    setError(null);

    try {
      await deleteMutation.mutateAsync(collection.id);
      setSuccess("Collection deleted successfully");
      setDeleteDialogOpen(false);
      router.push("/products/collections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !collection) return;

    setError(null);

    try {
      await uploadImageMutation.mutateAsync({ file, collectionId: collection.id });
      setSuccess("Image uploaded successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      e.target.value = "";
    }
  };

  const isNewArrivalsCollection = Boolean(
    collection &&
      (
        collection.handle.toLowerCase() === "new-arrivals" ||
        collection.title.toLowerCase() === "new arrivals"
      )
  );

  const isNewProduct = (product: ProductSummary): boolean => {
    const createdAt = new Date(product.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;
    return Date.now() - createdAt <= NEW_PRODUCT_MS;
  };

  const displayedProducts = showOnlyNewProducts
    ? searchResults.filter((product) => isNewProduct(product))
    : searchResults;

  const fetchProductsForSelection = async (query: string): Promise<ProductSummary[]> => {
    const products: ProductSummary[] = [];
    let start = 0;
    let totalElements = 0;

    do {
      const end = start + PRODUCT_FETCH_BATCH_SIZE;
      const response = await getProducts({
        q: query || undefined,
        start,
        end,
      });

      products.push(...response.content);
      totalElements = response.totalElements;
      start = end;

      if (response.content.length === 0) break;
    } while (start < totalElements);

    return products;
  };

  const handleSearchProducts = async (query: string) => {
    setProductSearch(query);

    setSearchingProducts(true);
    try {
      const trimmedQuery = query.trim();
      const products = await fetchProductsForSelection(trimmedQuery);
      const existingIds = new Set(collection?.products.map((p) => p.id) || []);
      const availableProducts = products
        .filter((p) => !existingIds.has(p.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSearchResults(availableProducts);
    } catch (err) {
      toast.error("Product search failed");
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleToggleShowOnlyNewProducts = (checked: boolean) => {
    setShowOnlyNewProducts(checked);
    if (!checked) return;

    const newProductIds = new Set(searchResults.filter((product) => isNewProduct(product)).map((p) => p.id));
    setSelectedProducts((previous) => previous.filter((id) => newProductIds.has(id)));
  };

  const handleAddProductsModalOpenChange = async (open: boolean) => {
    setAddProductsModalOpen(open);

    if (open) {
      const shouldDefaultToNewProducts = isNewArrivalsCollection;
      setShowOnlyNewProducts(shouldDefaultToNewProducts);
      setSelectedProducts([]);
      await handleSearchProducts("");
      return;
    }

    setProductSearch("");
    setSearchResults([]);
    setSelectedProducts([]);
    setShowOnlyNewProducts(false);
  };

  const handleAddProducts = async () => {
    if (!collection || selectedProducts.length === 0) return;

    setError(null);

    try {
      await addProductsMutation.mutateAsync({
        collectionId: collection.id,
        productIds: selectedProducts,
      });
      toast.success(`Added ${selectedProducts.length} product(s) to collection`);
      setAddProductsModalOpen(false);
      setSelectedProducts([]);
      setProductSearch("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add products");
    }
  };

  const handleRemoveProduct = (product: CollectionProduct) => {
    setConfirmRemoveProduct(product);
  };

  const confirmAndRemoveProduct = async () => {
    if (!collection || !confirmRemoveProduct) return;

    const productId = confirmRemoveProduct.id;
    setConfirmRemoveProduct(null);
    setRemovingProduct(productId);
    setError(null);

    try {
      await removeProductsMutation.mutateAsync({
        collectionId: collection.id,
        productIds: [productId],
      });
      toast.success("Product removed from collection");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove product");
    } finally {
      setRemovingProduct(null);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if ((queryError || error) && !collection) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error || (queryError instanceof Error ? queryError.message : "Failed to load collection")}</span>
        </div>
        <Button variant="outline" onClick={() => router.push("/products/collections")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{collection.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Product Confirmation Dialog */}
      <Dialog open={!!confirmRemoveProduct} onOpenChange={(open) => { if (!open) setConfirmRemoveProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{confirmRemoveProduct?.title}&quot; from this collection?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveProduct(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmAndRemoveProduct}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update collection details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-handle">Handle</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                  /collections/
                </span>
                <Input
                  id="edit-handle"
                  className="rounded-l-none"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending || !editForm.title.trim()}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Products Modal */}
      <Dialog open={addProductsModalOpen} onOpenChange={handleAddProductsModalOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Products to Collection</DialogTitle>
            <DialogDescription>
              Browse or search products to add to this collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={productSearch}
                onChange={(e) => handleSearchProducts(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="new-week-products" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  id="new-week-products"
                  checked={showOnlyNewProducts}
                  onCheckedChange={(checked) => handleToggleShowOnlyNewProducts(checked === true)}
                />
                New this week (created in last {NEW_PRODUCT_DAYS} days)
              </label>
              {!productSearch.trim() ? (
                <span className="text-xs text-muted-foreground">Showing latest products</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Results for &quot;{productSearch.trim()}&quot;
                </span>
              )}
            </div>

            {searchingProducts && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searchingProducts && displayedProducts.length > 0 && (
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer"
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {product.thumbnail ? (
                            <img
                              src={getImageUrl(product.thumbnail) || ""}
                              alt={product.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {product.title}
                            {isNewProduct(product) && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{product.handle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === "published" ? "default" : "secondary"}>
                            {product.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!searchingProducts && productSearch.trim().length > 0 && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching &quot;{productSearch}&quot;
              </div>
            )}

            {!searchingProducts && searchResults.length === 0 && productSearch.trim().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products available to add
              </div>
            )}

            {!searchingProducts && showOnlyNewProducts && searchResults.length > 0 && displayedProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products created in the last {NEW_PRODUCT_DAYS} days
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">{selectedProducts.length} product(s) selected</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void handleAddProductsModalOpenChange(false)}
              disabled={addProductsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProducts}
              disabled={addProductsMutation.isPending || selectedProducts.length === 0}
            >
              {addProductsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {selectedProducts.length > 0 ? `${selectedProducts.length} ` : ""}Products
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products/collections">Collections</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{collection.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-semibold">{collection.title}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">/{collection.handle}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(collection.handle)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openEditModal}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Store
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Details</CardTitle>
              <CardDescription>
                Update collection information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Handle</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                      /
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={editForm.handle}
                      onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending || (editForm.title === collection.title && editForm.handle === collection.handle)}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  {collection.productCount ?? 0} product{(collection.productCount ?? 0) !== 1 ? "s" : ""} in this collection
                </CardDescription>
              </div>
              <Button onClick={() => setAddProductsModalOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Products
              </Button>
            </CardHeader>
            <CardContent>
              {(!collection.products || collection.products.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No products yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add products to this collection to display them together
                  </p>
                  <Button variant="outline" onClick={() => setAddProductsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Products
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collection.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.thumbnail ? (
                            <img
                              src={getImageUrl(product.thumbnail) || ""}
                              alt={product.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            {product.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">/{product.handle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === "PUBLISHED" ? "default" : "secondary"}>
                            {product.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleRemoveProduct(product)}
                            disabled={removingProduct === product.id}
                          >
                            {removingProduct === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              {collection.imageUrl ? (
                <div className="space-y-3">
                  <img
                    src={getImageUrl(collection.imageUrl) || ""}
                    alt={collection.title}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <label className="flex items-center justify-center gap-2 w-full py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    {uploadImageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="text-sm">Replace image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadImageMutation.isPending}
                    />
                  </label>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors ${uploadImageMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadImageMutation.isPending ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadImageMutation.isPending}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="text-sm font-mono">{collection.id.slice(0, 8)}...</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(collection.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">{formatDate(collection.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting this collection cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Collection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
