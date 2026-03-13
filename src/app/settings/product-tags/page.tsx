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
import { Badge } from "@/components/ui/badge";
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

interface ProductTag {
  id: string;
  value: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductTagsResponse {
  productTags: ProductTag[];
  count: number;
  offset: number;
  limit: number;
}

export default function ProductTagsSettingsPage() {
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ProductTagsResponse>("/admin/product-tags?limit=100");
      setProductTags(data.productTags || []);
    } catch (err) {
      console.error("Failed to fetch product tags:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      setError("Tag name is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/admin/product-tags", {
        method: "POST",
        body: JSON.stringify({
          value: newTagName.trim(),
        }),
      });
      setCreateOpen(false);
      setNewTagName("");
      toast.success("Product tag created");
      fetchTags();
    } catch (err: any) {
      setError(err?.message || "Failed to create product tag");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/admin/product-tags/${id}`, { method: "DELETE" });
      toast.success("Product tag deleted");
      fetchTags();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product tag");
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
            <BreadcrumbPage>Product Tags</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Tags</CardTitle>
            <CardDescription>Manage tags for organizing products</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : productTags.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No product tags yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge variant="secondary">{tag.value}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tag.productCount} products
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
                            <Link href={`/products?tag=${encodeURIComponent(tag.value)}`}>
                              View Products
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(tag.id)}
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
            <DialogTitle>Add Product Tag</DialogTitle>
            <DialogDescription>Create a new tag to organize your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tagName">Name *</Label>
              <Input
                id="tagName"
                placeholder="e.g. new-arrival, bestseller"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
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
