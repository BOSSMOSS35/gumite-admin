"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ArrowLeft,
  UserPlus,
  X,
} from "lucide-react";
import {
  useCustomerGroups,
  useCreateCustomerGroup,
  useUpdateCustomerGroup,
  useDeleteCustomerGroup,
  useCustomers,
  useAddCustomerToGroup,
  useRemoveCustomerFromGroup,
} from "@/hooks/use-customers";
import {
  type CustomerGroup,
  type Customer,
  getCustomerName,
  getCustomerInitials,
} from "@/lib/api";
import { toast } from "sonner";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Selected group for member management
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);

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
    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      toast.success("Customer group created");
      handleCloseAdd();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  const handleUpdate = async () => {
    if (!groupToEdit || !formData.name.trim()) return;
    try {
      await updateMutation.mutateAsync({
        groupId: groupToEdit.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        },
      });
      toast.success("Customer group updated");
      handleCloseEdit();
      // Update selected group name if viewing it
      if (selectedGroup?.id === groupToEdit.id) {
        setSelectedGroup({ ...selectedGroup, name: formData.name.trim() });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update group");
    }
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteMutation.mutateAsync(groupToDelete.id);
      toast.success("Customer group deleted");
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      if (selectedGroup?.id === groupToDelete.id) {
        setSelectedGroup(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete group");
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
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full mb-4" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a group is selected, show its detail/members view
  if (selectedGroup) {
    return (
      <GroupDetailView
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onEdit={() => openEditModal(selectedGroup)}
        onDelete={() => openDeleteDialog(selectedGroup)}
      />
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Group Modals */}
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

      {/* Error */}
      {queryError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{queryError instanceof Error ? queryError.message : "Failed to load customer groups"}</span>
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
                <TableRow
                  key={group.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedGroup(group)}
                >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); }}>
                          <Users2 className="mr-2 h-4 w-4" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(group); }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(group); }}
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
                      <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
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

// ─── Group Detail View with Members ────────────────────────────
function GroupDetailView({
  group,
  onBack,
  onEdit,
  onDelete,
}: {
  group: CustomerGroup;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: membersData, isLoading: membersLoading } = useCustomers({
    groupId: group.id,
    limit: 200,
  });
  const removeMutation = useRemoveCustomerFromGroup();
  const [addMembersOpen, setAddMembersOpen] = useState(false);

  const members = membersData?.customers ?? [];

  const handleRemove = async (customer: Customer) => {
    try {
      await removeMutation.mutateAsync({
        customerId: customer.id,
        groupId: group.id,
      });
      toast.success(`${getCustomerName(customer)} removed from group`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove customer");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <AddMembersDialog
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        group={group}
        existingMemberIds={members.map((m) => m.id)}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Group
          </Button>
          <Button onClick={() => setAddMembersOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customers
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} customer{members.length !== 1 ? "s" : ""} in this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Users2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No customers in this group yet</p>
              <Button variant="outline" size="sm" onClick={() => setAddMembersOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customers
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-xs">
                            {getCustomerInitials(customer)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{getCustomerName(customer)}</span>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{customer.orderCount}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => handleRemove(customer)}
                        disabled={removeMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove from group</span>
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
  );
}

// ─── Add Members Dialog ────────────────────────────────────────
function AddMembersDialog({
  open,
  onOpenChange,
  group,
  existingMemberIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CustomerGroup;
  existingMemberIds: string[];
}) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const addMutation = useAddCustomerToGroup();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(customerSearch), 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const { data: searchResults, isLoading: searching } = useCustomers({
    q: debouncedSearch || undefined,
    limit: 20,
  });

  const availableCustomers = (searchResults?.customers ?? []).filter(
    (c) => !existingMemberIds.includes(c.id)
  );

  const handleAdd = async (customer: Customer) => {
    try {
      await addMutation.mutateAsync({
        customerId: customer.id,
        groupId: group.id,
      });
      toast.success(`${getCustomerName(customer)} added to ${group.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add customer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Customers to {group.name}</DialogTitle>
          <DialogDescription>
            Search for customers to add to this group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {searching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableCustomers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {debouncedSearch
                  ? "No customers found matching your search"
                  : "All customers are already in this group"}
              </div>
            ) : (
              availableCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {getCustomerInitials(customer)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{getCustomerName(customer)}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(customer)}
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Group Form Dialog ─────────────────────────────────────────
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
