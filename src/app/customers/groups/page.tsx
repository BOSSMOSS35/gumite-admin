"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Users2,
} from "lucide-react";
import {
  useCustomerGroups,
  useCreateCustomerGroup,
  useUpdateCustomerGroup,
  useDeleteCustomerGroup,
} from "@/hooks/use-customers";
import { type CustomerGroup, type CreateCustomerGroupRequest } from "@/lib/api";

type GroupFormData = {
  name: string;
  description: string;
};

const initialFormData: GroupFormData = {
  name: "",
  description: "",
};

export default function CustomerGroupsPage() {
  const { data, isLoading, error: queryError } = useCustomerGroups({ limit: 100 });
  const createMutation = useCreateCustomerGroup();
  const updateMutation = useUpdateCustomerGroup();
  const deleteMutation = useDeleteCustomerGroup();

  const groups = data?.groups ?? [];

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<CustomerGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null);
  const [formData, setFormData] = useState<GroupFormData>(initialFormData);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCloseAdd = () => {
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setGroupToEdit(null);
    setFormData(initialFormData);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setError(null);

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setSuccess("Customer group created successfully");
      handleCloseAdd();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  const handleUpdate = async () => {
    if (!groupToEdit || !formData.name.trim()) return;
    setError(null);

    try {
      await updateMutation.mutateAsync({
        groupId: groupToEdit.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        },
      });
      setSuccess("Customer group updated successfully");
      handleCloseEdit();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    }
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    setError(null);

    try {
      await deleteMutation.mutateAsync(groupToDelete.id);
      setSuccess("Customer group deleted successfully");
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    }
  };

  const openEditModal = (group: CustomerGroup) => {
    setGroupToEdit(group);
    setFormData({
      name: group.name,
      description: group.description || "",
    });
    setEditModalOpen(true);
  };

  const openDeleteDialog = (group: CustomerGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              {[1, 2, 3].map((i) => (
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
            <DialogTitle>Delete Customer Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{groupToDelete?.name}&quot;?
              Customers in this group will be unassigned. This action cannot be undone.
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

      {/* Add Group Modal */}
      <GroupFormDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Create Customer Group"
        description="Create a group to organize your customers"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
        onCancel={handleCloseAdd}
        isPending={createMutation.isPending}
        submitLabel="Create Group"
        pendingLabel="Creating..."
      />

      {/* Edit Group Modal */}
      <GroupFormDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Customer Group"
        description={`Update details for ${groupToEdit?.name ?? "group"}`}
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
                : "Failed to load customer groups")}
          </span>
          <button onClick={() => setError(null)} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Customer Groups</h1>
          <p className="text-muted-foreground">
            Organize customers into groups for targeted promotions and pricing
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
          <CardDescription>
            {filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <span className="font-medium">{group.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                    {group.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{group.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(group.createdAt)}
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
                        <DropdownMenuItem onClick={() => openEditModal(group)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteDialog(group)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users2 className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No customer groups found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddModalOpen(true)}
                      >
                        Create your first group
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

function GroupFormDialog({
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
  formData: GroupFormData;
  setFormData: (data: GroupFormData) => void;
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
            <Label htmlFor="group-name">Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. VIP Customers, Wholesale"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">
              Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="group-description"
              placeholder="Describe the purpose of this group"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
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
