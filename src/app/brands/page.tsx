"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Store,
  Globe,
  ExternalLink,
} from "lucide-react";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "@/hooks/use-brands";
import { type Brand, type CreateBrandInput } from "@/lib/api";

type BrandFormData = {
  name: string;
  description: string;
  websiteUrl: string;
  tier: string;
};

const initialFormData: BrandFormData = {
  name: "",
  description: "",
  websiteUrl: "",
  tier: "standard",
};

const tierLabels: Record<string, string> = {
  luxury: "Luxury",
  premium: "Premium",
  standard: "Standard",
};

const tierColors: Record<string, string> = {
  luxury: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  premium: "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300",
  standard: "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-300",
};

export default function BrandsPage() {
  const { data, isLoading, error: queryError } = useBrands({ offset: 0, limit: 100 });
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const brands = data?.brands ?? [];

  // Local UI state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(initialFormData);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCloseAdd = () => {
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setBrandToEdit(null);
    setFormData(initialFormData);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setError(null);

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        websiteUrl: formData.websiteUrl.trim() || undefined,
        tier: formData.tier,
      });
      setSuccess("Brand created successfully");
      handleCloseAdd();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    }
  };

  const handleUpdate = async () => {
    if (!brandToEdit || !formData.name.trim()) return;
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: brandToEdit.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          websiteUrl: formData.websiteUrl.trim() || undefined,
          tier: formData.tier,
        },
      });
      setSuccess("Brand updated successfully");
      handleCloseEdit();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update brand");
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;
    setError(null);

    try {
      await deleteMutation.mutateAsync(brandToDelete.id);
      setSuccess("Brand deleted successfully");
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete brand");
    }
  };

  const openEditModal = (brand: Brand) => {
    setBrandToEdit(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      websiteUrl: brand.websiteUrl || "",
      tier: brand.tier,
    });
    setEditModalOpen(true);
  };

  const openDeleteDialog = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{brandToDelete?.name}&quot;?
              Products using this brand will be unlinked. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
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

      {/* Add Brand Modal */}
      <BrandFormDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Create Brand"
        description="Add a new brand to your catalog"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
        onCancel={handleCloseAdd}
        isPending={createMutation.isPending}
        submitLabel="Create Brand"
        pendingLabel="Creating..."
      />

      {/* Edit Brand Modal */}
      <BrandFormDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Brand"
        description={`Update details for ${brandToEdit?.name ?? "brand"}`}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdate}
        onCancel={handleCloseEdit}
        isPending={updateMutation.isPending}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
      />

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
      {(error || queryError) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>
            {error ||
              (queryError instanceof Error
                ? queryError.message
                : "Failed to load brands")}
          </span>
          <button onClick={() => setError(null)} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage the brands in your catalog
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>
            {filteredBrands.length} brand{filteredBrands.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-8 w-8 rounded object-contain"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Store className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{brand.name}</span>
                        {brand.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {brand.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {brand.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={tierColors[brand.tier] || tierColors.standard}
                    >
                      {tierLabels[brand.tier] || brand.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.active ? "default" : "secondary"}>
                      {brand.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {brand.websiteUrl ? (
                      <a
                        href={brand.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Globe className="h-3 w-3" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(brand.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(brand)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteDialog(brand)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBrands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Store className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No brands found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddModalOpen(true)}
                      >
                        Add your first brand
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BrandFormDialog({
  open,
  onOpenChange,
  title,
  description,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  pendingLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formData: BrandFormData;
  setFormData: (data: BrandFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Name</Label>
            <Input
              id="brand-name"
              placeholder="e.g. Nike, Gucci, Zara"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-description">
              Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="brand-description"
              placeholder="Brief description of the brand"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-website">
                Website <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="brand-website"
                placeholder="https://www.example.com"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) =>
                  setFormData({ ...formData, tier: value })
                }
              >
                <SelectTrigger id="brand-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim() || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
