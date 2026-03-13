"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ProductType {
  id: string;
  value: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductTypesResponse {
  productTypes: ProductType[];
  count: number;
  offset: number;
  limit: number;
}

export default function ProductTypesSettingsPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ProductTypesResponse>("/admin/product-types?limit=100");
      setProductTypes(data.productTypes || []);
    } catch (err) {
      console.error("Failed to fetch product types:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleCreate = async () => {
    if (!newTypeName.trim()) {
      setError("Type name is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/admin/product-types", {
        method: "POST",
        body: JSON.stringify({
          value: newTypeName.trim(),
          description: newTypeDesc.trim() || null,
        }),
      });
      setCreateOpen(false);
      setNewTypeName("");
      setNewTypeDesc("");
      toast.success("Product type created");
      fetchTypes();
    } catch (err: any) {
      setError(err?.message || "Failed to create product type");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/admin/product-types/${id}`, { method: "DELETE" });
      toast.success("Product type deleted");
      fetchTypes();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product type");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Product Types</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Types</CardTitle>
            <CardDescription>Manage the types of products in your store</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Type
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : productTypes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No product types yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium capitalize">{type.value}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.description || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.productCount} products
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products?type=${encodeURIComponent(type.value)}`}>
                              View Products
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(type.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Product Type</DialogTitle>
            <DialogDescription>Create a new product type to categorize your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="typeName">Name *</Label>
              <Input
                id="typeName"
                placeholder="e.g. Clothing, Electronics"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="typeDesc">Description</Label>
              <Input
                id="typeDesc"
                placeholder="Optional description"
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
