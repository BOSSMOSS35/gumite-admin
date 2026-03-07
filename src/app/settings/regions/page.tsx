"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Loader2, MoreHorizontal, Plus } from "lucide-react";
import {
  createAdminRegion,
  getAdminRegions,
  getStores,
  updateStore,
  type AdminRegion,
  type Store,
} from "@/lib/api";
import { toast } from "sonner";

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD", "JPY", "CHF", "AED", "SGD", "HKD"];

function formatTaxRate(rate: number): string {
  const normalized = rate > 1 ? rate / 100 : rate;
  return `${(normalized * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

export default function RegionsSettingsPage() {
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [settingDefaultRegionId, setSettingDefaultRegionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("GBP");
  const [taxRatePercent, setTaxRatePercent] = useState("20");
  const [taxCode, setTaxCode] = useState("");
  const [countryCodes, setCountryCodes] = useState("GB");
  const [automaticTaxes, setAutomaticTaxes] = useState(true);
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [setDefaultRegion, setSetDefaultRegion] = useState(true);
  const [defaultStoreId, setDefaultStoreId] = useState<string>("");

  const fetchData = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [regionsResponse, storesResponse] = await Promise.all([
        getAdminRegions({ limit: 100, offset: 0 }),
        getStores({ limit: 100 }),
      ]);

      setRegions(regionsResponse.regions ?? []);
      setStores(storesResponse.stores ?? []);
      if (!defaultStoreId && storesResponse.stores.length > 0) {
        setDefaultStoreId(storesResponse.stores[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load regions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultRegionToStores = useMemo(() => {
    const map = new Map<string, string[]>();
    stores.forEach((store) => {
      if (!store.default_region_id) return;
      const list = map.get(store.default_region_id) ?? [];
      list.push(store.name);
      map.set(store.default_region_id, list);
    });
    return map;
  }, [stores]);

  const resetCreateForm = () => {
    setName("");
    setCurrencyCode("GBP");
    setTaxRatePercent("20");
    setTaxCode("");
    setCountryCodes("GB");
    setAutomaticTaxes(true);
    setTaxInclusive(true);
    setSetDefaultRegion(true);
  };

  const handleSetDefault = async (regionId: string) => {
    if (stores.length === 0) {
      toast.error("No store found. Create a store first.");
      return;
    }
    try {
      setSettingDefaultRegionId(regionId);
      await updateStore(stores[0].id, { default_region_id: regionId });
      toast.success("Default region updated");
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set default region");
    } finally {
      setSettingDefaultRegionId(null);
    }
  };

  const handleCreateRegion = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Region name is required");
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const duplicateRegion = regions.find((region) => region.name.trim().toLowerCase() === normalizedName);
    if (duplicateRegion) {
      toast.error(`Region "${trimmedName}" already exists`);
      return;
    }

    const parsedTaxRate = Number.parseFloat(taxRatePercent);
    if (Number.isNaN(parsedTaxRate) || parsedTaxRate < 0) {
      toast.error("Tax rate must be a valid non-negative number");
      return;
    }

    const parsedCountryCodes = countryCodes
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

    if (parsedCountryCodes.length === 0) {
      toast.error("Add at least one ISO2 country code (for example: GB, US)");
      return;
    }

    try {
      setIsCreating(true);

      const response = await createAdminRegion({
        name: trimmedName,
        currencyCode,
        automaticTaxes,
        taxCode: taxCode.trim() || undefined,
        giftCardsTaxable: false,
        taxRate: parsedTaxRate,
        taxInclusive,
        countryCodes: parsedCountryCodes,
      });

      const createdRegion = response.regions?.[0];
      if (!createdRegion) {
        throw new Error("Region was created but no region payload was returned");
      }

      if (setDefaultRegion && defaultStoreId) {
        await updateStore(defaultStoreId, { default_region_id: createdRegion.id });
      }

      toast.success("Region created");
      setIsCreateOpen(false);
      resetCreateForm();
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create region");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading regions...
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
            <BreadcrumbPage>Regions</BreadcrumbPage>
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
            <CardTitle>Regions</CardTitle>
            <CardDescription>
              Configure where your store operates and which tax settings apply by market.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Region
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No regions yet. Add your first region to enable tax-aware carts and checkout.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Default Tax</TableHead>
                  <TableHead>Default For Store</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => {
                  const defaultStores = defaultRegionToStores.get(region.id) ?? [];
                  return (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>
                        {region.countries.length === 0
                          ? "-"
                          : `${region.countries.slice(0, 3).map((country) => country.iso_2).join(", ")}${
                              region.countries.length > 3 ? ` +${region.countries.length - 3}` : ""
                            }`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{region.currency_code}</Badge>
                      </TableCell>
                      <TableCell>{formatTaxRate(region.tax_rate)}</TableCell>
                      <TableCell>
                        {defaultStores.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {defaultStores.map((storeName) => (
                              <Badge key={`${region.id}-${storeName}`} variant="outline">
                                {storeName}
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
                            <DropdownMenuItem
                              disabled={defaultStores.length > 0 || settingDefaultRegionId === region.id}
                              onClick={() => handleSetDefault(region.id)}
                            >
                              {settingDefaultRegionId === region.id ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : null}
                              {defaultStores.length > 0 ? "Already Default" : "Set as Store Default"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/settings/regions?regionId=${region.id}`}>Manage Region</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/settings/tax-regions">Manage Tax Rates</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Region</DialogTitle>
            <DialogDescription>
              Region setup controls currency and tax behavior for carts and orders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regionName">Region Name</Label>
              <Input
                id="regionName"
                placeholder="United Kingdom"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={taxRatePercent}
                onChange={(event) => setTaxRatePercent(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxCode">Tax Code</Label>
              <Input
                id="taxCode"
                placeholder="UK-VAT"
                value={taxCode}
                onChange={(event) => setTaxCode(event.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="countryCodes">Country Codes (ISO2, comma-separated)</Label>
              <Input
                id="countryCodes"
                placeholder="GB, IE"
                value={countryCodes}
                onChange={(event) => setCountryCodes(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="automaticTaxes">Automatic Taxes</Label>
                <p className="text-xs text-muted-foreground">Automatically calculate taxes for this region.</p>
              </div>
              <Switch id="automaticTaxes" checked={automaticTaxes} onCheckedChange={setAutomaticTaxes} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="taxInclusive">Prices Include Tax</Label>
                <p className="text-xs text-muted-foreground">Enable if product prices are tax-inclusive.</p>
              </div>
              <Switch id="taxInclusive" checked={taxInclusive} onCheckedChange={setTaxInclusive} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="setDefaultRegion">Set As Store Default Region</Label>
                <p className="text-xs text-muted-foreground">
                  Recommended for initial setup so carts and tax calculations always have a region.
                </p>
              </div>
              <Switch
                id="setDefaultRegion"
                checked={setDefaultRegion}
                onCheckedChange={setSetDefaultRegion}
                disabled={stores.length === 0}
              />
            </div>

            <div className="space-y-2">
              <Label>Store</Label>
              <Select
                value={defaultStoreId}
                onValueChange={setDefaultStoreId}
                disabled={!setDefaultRegion || stores.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={stores.length === 0 ? "Create a store first" : "Select store"} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateRegion} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Region"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
