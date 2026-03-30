"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ShipFromAddress {
  id: string;
  label: string;
  name: string;
  company: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country_code: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
}

const EMPTY_FORM = {
  label: "",
  name: "",
  company: "",
  street1: "",
  street2: "",
  city: "",
  state_province: "",
  postal_code: "",
  country_code: "GB",
  phone: "",
  email: "",
};

export default function LocationsSettingsPage() {
  const [addresses, setAddresses] = useState<ShipFromAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAddresses = async () => {
    try {
      const data = await apiFetch<{ addresses: ShipFromAddress[] }>(
        "/admin/shipping/from-addresses"
      );
      setAddresses(data.addresses || []);
    } catch {
      // May 404 if no addresses yet
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (addr: ShipFromAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      name: addr.name,
      company: addr.company || "",
      street1: addr.street1,
      street2: addr.street2 || "",
      city: addr.city,
      state_province: addr.state_province || "",
      postal_code: addr.postal_code,
      country_code: addr.country_code,
      phone: addr.phone || "",
      email: addr.email || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.street1.trim() || !form.city.trim() || !form.postal_code.trim()) {
      toast.error("Name, street, city, and postal code are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: form.label || "Default",
        name: form.name,
        company: form.company || null,
        street1: form.street1,
        street2: form.street2 || null,
        city: form.city,
        state_province: form.state_province || null,
        postal_code: form.postal_code,
        country_code: form.country_code || "GB",
        phone: form.phone || null,
        email: form.email || null,
        is_default: addresses.length === 0,
      };
      if (editingId) {
        await apiFetch(`/admin/shipping/from-addresses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Address updated");
      } else {
        await apiFetch("/admin/shipping/from-addresses", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Address created");
      }
      setDialogOpen(false);
      fetchAddresses();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await apiFetch(`/admin/shipping/from-addresses/${id}/set-default`, {
        method: "PUT",
      });
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to set default");
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await apiFetch(`/admin/shipping/from-addresses/${id}`, {
        method: "DELETE",
      });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
            <BreadcrumbPage>Locations & Shipping</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Ship-From Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ship-From Addresses
            </CardTitle>
            <CardDescription>
              Addresses used as the return/sender address on shipping labels.
              The default address is used automatically when generating labels
              via ShipEngine.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No ship-from addresses configured. Add one to start generating
                shipping labels.
              </p>
              <Button variant="outline" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((addr) => (
                  <TableRow key={addr.id}>
                    <TableCell>
                      <div className="font-medium">{addr.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {addr.name}
                        {addr.company ? ` · ${addr.company}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div>{addr.street1}</div>
                      {addr.street2 && <div>{addr.street2}</div>}
                      <div>
                        {addr.city}
                        {addr.state_province ? `, ${addr.state_province}` : ""}{" "}
                        {addr.postal_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{addr.country_code}</Badge>
                    </TableCell>
                    <TableCell>
                      {addr.is_default ? (
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(addr)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!addr.is_default && (
                            <DropdownMenuItem
                              onClick={() => setDefault(addr.id)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteAddress(addr.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Ship-From Address" : "Add Ship-From Address"}
            </DialogTitle>
            <DialogDescription>
              This address will appear as the sender on shipping labels.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="e.g. UK Warehouse"
                  value={form.label}
                  onChange={(e) => updateField("label", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Gumite Ltd"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input
                placeholder="123 High Street"
                value={form.street1}
                onChange={(e) => updateField("street1", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Street Address 2</Label>
              <Input
                placeholder="Unit 5"
                value={form.street2}
                onChange={(e) => updateField("street2", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  placeholder="London"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>State / Province</Label>
                <Input
                  placeholder="Greater London"
                  value={form.state_province}
                  onChange={(e) => updateField("state_province", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code *</Label>
                <Input
                  placeholder="SW1A 1AA"
                  value={form.postal_code}
                  onChange={(e) => updateField("postal_code", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country Code *</Label>
                <Input
                  placeholder="GB"
                  maxLength={2}
                  value={form.country_code}
                  onChange={(e) =>
                    updateField("country_code", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+44 20 7946 0958"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="warehouse@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
