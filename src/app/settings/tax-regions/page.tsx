"use client";

import { useEffect, useMemo, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createTaxRate,
  deleteTaxRate,
  getTaxRegions,
  updateTaxRate,
  type AdminTaxRate,
  type TaxRegion,
} from "@/lib/api";
import { toast } from "sonner";

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, "")}%`;
}

export default function TaxRegionsSettingsPage() {
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateRateOpen, setIsCreateRateOpen] = useState(false);
  const [isCreatingRate, setIsCreatingRate] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [rateName, setRateName] = useState("");
  const [rateCode, setRateCode] = useState("");
  const [ratePercent, setRatePercent] = useState("20");
  const [editingRate, setEditingRate] = useState<AdminTaxRate | null>(null);
  const [deletingRate, setDeletingRate] = useState<AdminTaxRate | null>(null);
  const [isEditRateOpen, setIsEditRateOpen] = useState(false);
  const [isDeleteRateOpen, setIsDeleteRateOpen] = useState(false);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [isDeletingRate, setIsDeletingRate] = useState(false);
  const [editRateName, setEditRateName] = useState("");
  const [editRateCode, setEditRateCode] = useState("");
  const [editRatePercent, setEditRatePercent] = useState("0");

  const loadTaxRegions = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const response = await getTaxRegions({ limit: 100, offset: 0 });
      setTaxRegions(response.taxRegions ?? []);
      if (!selectedRegionId && (response.taxRegions?.length ?? 0) > 0) {
        setSelectedRegionId(response.taxRegions[0].regionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tax regions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTaxRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTaxRates = useMemo(
    () => taxRegions.flatMap((region) => region.taxRates.map((rate) => ({ ...rate, regionName: region.regionName }))),
    [taxRegions]
  );

  const openCreateRateForRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    setRateName("");
    setRateCode("");
    setRatePercent("20");
    setIsCreateRateOpen(true);
  };

  const openEditRateDialog = (rate: AdminTaxRate) => {
    setEditingRate(rate);
    setEditRateName(rate.name);
    setEditRateCode(rate.code || "");
    setEditRatePercent(rate.rate.toString());
    setIsEditRateOpen(true);
  };

  const handleCreateTaxRate = async () => {
    const trimmedName = rateName.trim();
    if (!trimmedName) {
      toast.error("Tax rate name is required");
      return;
    }
    if (!selectedRegionId) {
      toast.error("Select a region");
      return;
    }

    const parsedRate = Number.parseFloat(ratePercent);
    if (Number.isNaN(parsedRate) || parsedRate < 0) {
      toast.error("Tax rate must be a valid non-negative number");
      return;
    }

    try {
      setIsCreatingRate(true);
      await createTaxRate({
        name: trimmedName,
        code: rateCode.trim() || undefined,
        rate: parsedRate,
        regionId: selectedRegionId,
      });

      toast.success("Tax rate created");
      setRateName("");
      setRateCode("");
      setRatePercent("20");
      setIsCreateRateOpen(false);
      await loadTaxRegions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tax rate");
    } finally {
      setIsCreatingRate(false);
    }
  };

  const handleUpdateTaxRate = async () => {
    if (!editingRate) return;

    const trimmedName = editRateName.trim();
    if (!trimmedName) {
      toast.error("Tax rate name is required");
      return;
    }

    const parsedRate = Number.parseFloat(editRatePercent);
    if (Number.isNaN(parsedRate) || parsedRate < 0) {
      toast.error("Tax rate must be a valid non-negative number");
      return;
    }

    try {
      setIsUpdatingRate(true);
      await updateTaxRate(editingRate.id, {
        name: trimmedName,
        code: editRateCode.trim() || null,
        rate: parsedRate,
      });
      toast.success("Tax rate updated");
      setIsEditRateOpen(false);
      setEditingRate(null);
      await loadTaxRegions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tax rate");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const openDeleteRateDialog = (rate: AdminTaxRate) => {
    setDeletingRate(rate);
    setIsDeleteRateOpen(true);
  };

  const handleDeleteTaxRate = async () => {
    if (!deletingRate) return;

    try {
      setIsDeletingRate(true);
      await deleteTaxRate(deletingRate.id);
      toast.success("Tax rate deleted");
      setIsDeleteRateOpen(false);
      setDeletingRate(null);
      await loadTaxRegions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tax rate");
    } finally {
      setIsDeletingRate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tax regions...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tax Regions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tax Regions</CardTitle>
            <CardDescription>
              Region tax defaults and custom tax rates used by checkout/order tax workflows.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => loadTaxRegions(true)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateRateOpen(true)} disabled={taxRegions.length === 0}>
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {taxRegions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No tax regions found. Create a region in <span className="font-medium">Settings &gt; Regions</span> first.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Default Tax Rate</TableHead>
                  <TableHead>Custom Rates</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxRegions.map((region) => (
                  <TableRow key={region.regionId}>
                    <TableCell className="font-medium">{region.regionName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{region.currencyCode}</Badge>
                    </TableCell>
                    <TableCell>{formatPercent(region.defaultTaxRate)}</TableCell>
                    <TableCell>
                      {region.taxRateCount === 0 ? (
                        <span className="text-muted-foreground">0</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline">{region.taxRateCount} rate(s)</Badge>
                          {region.taxRates.slice(0, 2).map((rate) => (
                            <Badge key={rate.id} variant="secondary">
                              {rate.name}
                            </Badge>
                          ))}
                        </div>
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
                          <DropdownMenuItem onClick={() => openCreateRateForRegion(region.regionId)}>
                            Add Tax Rate
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

      {allTaxRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Tax Rates</CardTitle>
            <CardDescription>Custom tax rates configured across all regions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTaxRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>{rate.code || "-"}</TableCell>
                    <TableCell>{rate.regionName}</TableCell>
                    <TableCell>{formatPercent(rate.rate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditRateDialog(rate)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteRateDialog(rate)}
                            className="text-destructive focus:text-destructive"
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
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateRateOpen} onOpenChange={setIsCreateRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tax Rate</DialogTitle>
            <DialogDescription>
              Add a custom tax rate for a specific region.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {taxRegions.map((region) => (
                    <SelectItem key={region.regionId} value={region.regionId}>
                      {region.regionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateName">Name</Label>
              <Input
                id="rateName"
                placeholder="Standard VAT"
                value={rateName}
                onChange={(event) => setRateName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateCode">Code</Label>
              <Input
                id="rateCode"
                placeholder="UK-VAT"
                value={rateCode}
                onChange={(event) => setRateCode(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratePercent">Rate (%)</Label>
              <Input
                id="ratePercent"
                type="number"
                min="0"
                step="0.01"
                value={ratePercent}
                onChange={(event) => setRatePercent(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRateOpen(false)} disabled={isCreatingRate}>
              Cancel
            </Button>
            <Button onClick={handleCreateTaxRate} disabled={isCreatingRate}>
              {isCreatingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Tax Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRateOpen} onOpenChange={setIsEditRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tax Rate</DialogTitle>
            <DialogDescription>Update this tax rate configuration.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRateName">Name</Label>
              <Input
                id="editRateName"
                value={editRateName}
                onChange={(event) => setEditRateName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRateCode">Code</Label>
              <Input
                id="editRateCode"
                value={editRateCode}
                onChange={(event) => setEditRateCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRatePercent">Rate (%)</Label>
              <Input
                id="editRatePercent"
                type="number"
                min="0"
                step="0.01"
                value={editRatePercent}
                onChange={(event) => setEditRatePercent(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRateOpen(false)} disabled={isUpdatingRate}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTaxRate} disabled={isUpdatingRate}>
              {isUpdatingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteRateOpen} onOpenChange={setIsDeleteRateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Rate</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove tax rate <span className="font-medium">{deletingRate?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRate}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTaxRate}
              disabled={isDeletingRate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingRate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
