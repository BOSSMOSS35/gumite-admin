"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { updateAdminProfile } from "@/lib/api";

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setSaving(true);
    try {
      await updateAdminProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success("Profile updated");
      setIsEditing(false);
      refreshUser?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayFirstName = user?.firstName || "Admin";
  const displayLastName = user?.lastName || "User";
  const displayEmail = user?.email || "admin@vernont.com";

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
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Personal Information Card */}
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your Gumite profile</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          {/* Edit User Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Edit information</h4>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-lg">
                  {displayFirstName[0]}
                  {displayLastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {displayFirstName} {displayLastName}
                </p>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isEditing || saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isEditing || saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Insights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Usage insights</h4>
                <p className="text-sm text-muted-foreground">
                  Share usage insights and help us improve Gumite
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <Separator />

          {/* Language Preference */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Language</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your language preferences
                </p>
              </div>
              <Button variant="outline" size="sm">
                English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
