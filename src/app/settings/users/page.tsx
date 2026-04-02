"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  UserPlus,
  Shield,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  ApiError,
  type InternalUser,
  type InternalUserRole,
} from "@/lib/api";
import { getRoleBadgeColor, getRoleDisplayName } from "@/lib/auth";
import {
  useInternalUsers,
  useCreateUser,
  useInviteUser,
  useUpdateUser,
  useArchiveUser,
  useHardDeleteUser,
  useRestoreUser,
} from "@/hooks/use-users";

const AVAILABLE_ROLES: { value: InternalUserRole; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Full access to all features" },
];

export default function UsersSettingsPage() {
  const {
    data: usersData,
    isLoading,
    error: queryError,
  } = useInternalUsers({ limit: 100 });

  const users = usersData?.users || [];

  const createMutation = useCreateUser();
  const inviteMutation = useInviteUser();
  const updateMutation = useUpdateUser();
  const archiveMutation = useArchiveUser();
  const hardDeleteMutation = useHardDeleteUser();
  const restoreMutation = useRestoreUser();

  const [searchQuery, setSearchQuery] = useState("");

  // Add/Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<"invite" | "create">("create");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["ADMIN"]);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Reset password modal state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<InternalUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Archive confirmation state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archivingUser, setArchivingUser] = useState<InternalUser | null>(null);

  // Hard delete confirmation state (permanent)
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [hardDeletingUser, setHardDeletingUser] = useState<InternalUser | null>(null);
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState("");

  // Extract error message from API error
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "An unexpected error occurred";
  };

  // Filter users by search
  const filteredUsers = users.filter((user: InternalUser) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roles.some((r: string) => r.toLowerCase().includes(query))
    );
  });

  // Handle add/invite
  const handleInvite = async () => {
    if (!inviteEmail || inviteRoles.length === 0) {
      setInviteError("Email and at least one role are required");
      return;
    }

    if (inviteMode === "create" && !invitePassword) {
      setInviteError("Password is required when creating a user directly");
      return;
    }

    if (inviteMode === "create" && invitePassword.length < 8) {
      setInviteError("Password must be at least 8 characters");
      return;
    }

    try {
      setInviteError(null);
      if (inviteMode === "create") {
        await createMutation.mutateAsync({
          email: inviteEmail,
          password: invitePassword,
          firstName: inviteFirstName || undefined,
          lastName: inviteLastName || undefined,
          roles: inviteRoles,
        });
      } else {
        await inviteMutation.mutateAsync({
          email: inviteEmail,
          firstName: inviteFirstName || undefined,
          lastName: inviteLastName || undefined,
          roles: inviteRoles,
        });
      }
      setIsInviteOpen(false);
      resetInviteForm();
    } catch (err) {
      setInviteError(getErrorMessage(err));
    }
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setInvitePassword("");
    setShowInvitePassword(false);
    setInviteFirstName("");
    setInviteLastName("");
    setInviteRoles(["ADMIN"]);
    setInviteMode("create");
    setInviteError(null);
  };

  // Handle reset password
  const openResetPassword = (user: InternalUser) => {
    setResetPasswordUser(user);
    setNewPassword("");
    setShowNewPassword(false);
    setResetPasswordError(null);
    setIsResetPasswordOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) {
      setResetPasswordError("Password is required");
      return;
    }
    if (newPassword.length < 8) {
      setResetPasswordError("Password must be at least 8 characters");
      return;
    }
    try {
      setResetPasswordError(null);
      await updateMutation.mutateAsync({
        userId: resetPasswordUser.id,
        data: { password: newPassword },
      });
      setIsResetPasswordOpen(false);
      setResetPasswordUser(null);
    } catch (err) {
      setResetPasswordError(getErrorMessage(err));
    }
  };

  // Handle restore
  const handleRestore = async (user: InternalUser) => {
    try {
      await restoreMutation.mutateAsync(user.id);
    } catch (err) {
      console.error("Failed to restore user:", err);
    }
  };

  // Handle edit
  const openEditModal = (user: InternalUser) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditRoles(user.roles);
    setEditIsActive(user.isActive);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser || editRoles.length === 0) {
      setEditError("At least one role is required");
      return;
    }

    try {
      setEditError(null);
      await updateMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          firstName: editFirstName || undefined,
          lastName: editLastName || undefined,
          roles: editRoles,
          isActive: editIsActive,
        },
      });
      setIsEditOpen(false);
      setEditingUser(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  };

  // Handle archive (soft delete)
  const openArchiveConfirm = (user: InternalUser) => {
    setArchivingUser(user);
    setIsArchiveOpen(true);
  };

  const handleArchive = async () => {
    if (!archivingUser) return;

    try {
      await archiveMutation.mutateAsync(archivingUser.id);
      setIsArchiveOpen(false);
      setArchivingUser(null);
    } catch (err) {
      console.error("Failed to archive user:", err);
    }
  };

  // Handle hard delete (permanent)
  const openHardDeleteConfirm = (user: InternalUser) => {
    setHardDeletingUser(user);
    setHardDeleteConfirmText("");
    setIsHardDeleteOpen(true);
  };

  const handleHardDelete = async () => {
    if (!hardDeletingUser) return;

    try {
      await hardDeleteMutation.mutateAsync(hardDeletingUser.id);
      setIsHardDeleteOpen(false);
      setHardDeletingUser(null);
      setHardDeleteConfirmText("");
    } catch (err) {
      console.error("Failed to permanently delete user:", err);
    }
  };

  // Get user initials
  const getUserInitials = (user: InternalUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email[0].toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (user: InternalUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email.split("@")[0];
  };

  // Toggle role in list
  const toggleRole = (role: string, rolesList: string[], setRoles: (roles: string[]) => void) => {
    if (rolesList.includes(role)) {
      if (rolesList.length > 1) {
        setRoles(rolesList.filter((r) => r !== role));
      }
    } else {
      setRoles([...rolesList, role]);
    }
  };

  const error = queryError ? getErrorMessage(queryError) : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>The Team</CardTitle>
            <CardDescription>Manage users of your Gumite Store</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { setInviteMode("invite"); setIsInviteOpen(true); }}>
              <Mail className="h-4 w-4" />
              Invite via Email
            </Button>
            <Button className="gap-2" onClick={() => { setInviteMode("create"); setIsInviteOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role(s)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: InternalUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{getUserDisplayName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role: string) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className={getRoleBadgeColor(role)}
                              >
                                {getRoleDisplayName(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.inviteStatus === "PENDING" ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Pending Invite
                            </Badge>
                          ) : user.inviteStatus === "ACCEPTED" ? (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          ) : user.inviteStatus === "EXPIRED" ? (
                            <Badge variant="secondary" className="text-red-500">
                              Expired
                            </Badge>
                          ) : user.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPassword(user)}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!user.isActive && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(user)}
                                  className="text-green-600"
                                >
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Restore User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => openArchiveConfirm(user)}
                                className="text-amber-600"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openHardDeleteConfirm(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {filteredUsers.length} member{filteredUsers.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={(open) => {
        setIsInviteOpen(open);
        if (!open) resetInviteForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {inviteMode === "create" ? "Add Team Member" : "Invite Team Member"}
            </DialogTitle>
            <DialogDescription>
              {inviteMode === "create"
                ? "Create a new user with a password they can use to log in immediately."
                : "Send an invitation email. They will receive a link to set up their account."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${inviteMode === "create" ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
                onClick={() => setInviteMode("create")}
              >
                Create with Password
              </button>
              <button
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${inviteMode === "invite" ? "bg-background shadow font-medium" : "text-muted-foreground"}`}
                onClick={() => setInviteMode("invite")}
              >
                Send Invite Email
              </button>
            </div>

            {inviteError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {inviteError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-firstname">First Name</Label>
                <Input
                  id="invite-firstname"
                  placeholder="John"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-lastname">Last Name</Label>
                <Input
                  id="invite-lastname"
                  placeholder="Doe"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>

            {inviteMode === "create" && (
              <div className="grid gap-2">
                <Label htmlFor="invite-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="invite-password"
                    type={showInvitePassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showInvitePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles *
              </Label>
              <div className="grid gap-2 p-3 border rounded-lg">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start gap-3">
                    <Checkbox
                      id={`invite-role-${role.value}`}
                      checked={inviteRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value, inviteRoles, setInviteRoles)}
                    />
                    <div className="grid gap-0.5">
                      <Label
                        htmlFor={`invite-role-${role.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {role.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending || createMutation.isPending}>
              {(inviteMutation.isPending || createMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {inviteMode === "create" ? "Creating..." : "Sending..."}
                </>
              ) : inviteMode === "create" ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={editingUser?.avatarUrl || undefined} />
                <AvatarFallback>{editingUser ? getUserInitials(editingUser) : "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editingUser?.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {editingUser?.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstname">First Name</Label>
                <Input
                  id="edit-firstname"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastname">Last Name</Label>
                <Input
                  id="edit-lastname"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles *
              </Label>
              <div className="grid gap-2 p-3 border rounded-lg">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start gap-3">
                    <Checkbox
                      id={`edit-role-${role.value}`}
                      checked={editRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value, editRoles, setEditRoles)}
                    />
                    <div className="grid gap-0.5">
                      <Label
                        htmlFor={`edit-role-${role.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {role.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                id="edit-active"
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked === true)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor="edit-active" className="font-medium cursor-pointer">
                  Active
                </Label>
                <span className="text-xs text-muted-foreground">
                  Inactive users cannot log in to the admin dashboard
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Archive User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{archivingUser?.email}</strong>?
              The user will no longer be able to access the admin dashboard, but their data will be preserved and they can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Archive User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {resetPasswordError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {resetPasswordError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Set Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation Dialog - with type-to-confirm */}
      <AlertDialog open={isHardDeleteOpen} onOpenChange={(open) => {
        setIsHardDeleteOpen(open);
        if (!open) setHardDeleteConfirmText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to <strong className="text-red-600">permanently delete</strong>{" "}
                <strong>{hardDeletingUser?.email}</strong>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <p className="font-semibold mb-1">This action cannot be undone!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All user data will be permanently removed</li>
                  <li>All role associations will be deleted</li>
                  <li>This user cannot be restored</li>
                </ul>
              </div>
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={hardDeleteConfirmText}
                  onChange={(e) => setHardDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={hardDeleteMutation.isPending || hardDeleteConfirmText !== "DELETE"}
            >
              {hardDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
