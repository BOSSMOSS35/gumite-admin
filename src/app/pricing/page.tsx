"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  Search,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Tag,
  Percent,
  Save,
  X,
  History,
  Zap,
  Clock,
} from "lucide-react";
import {
  formatPrice,
  type WorkbenchItem,
  type PricingRuleDto,
  getPricingRuleStatusDisplay,
  getPricingRuleTypeDisplay,
  getPriceChangeTypeDisplay,
  formatDateTime,
} from "@/lib/api";
import { usePricingEvents, type PricingEvent } from "@/hooks/use-pricing-events";
import {
  usePricingWorkbench,
  usePricingRules,
  usePriceHistory,
  useBulkUpdatePrices,
  useActivatePricingRule,
  useDeactivatePricingRule,
  useDeletePricingRule,
} from "@/hooks/use-pricing";
import { PricingRuleDialog } from "@/components/pricing/PricingRuleDialog";
import {
  useRegisterShortcut,
  useKeyboardShortcutsContext,
} from "@/contexts/keyboard-shortcuts-context";
import { SHORTCUTS, formatShortcut } from "@/hooks/use-keyboard-shortcut";
import { getImageUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface PendingChange {
  variantId: string;
  originalPrice: number;
  newPrice: number;
  compareAtPrice?: number;
}

export default function PricingPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
  });

  // Rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRuleDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<PricingRuleDto | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, offset: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // WebSocket for real-time updates
  const { isConnected, events } = usePricingEvents({
    onPriceChange: (event) => {
      if (event.variantId && !pendingChanges.has(event.variantId)) {
        queryClient.invalidateQueries({ queryKey: ["pricing", "workbench"] });
      }
    },
    onBulkUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing", "workbench"] });
    },
  });

  // React Query hooks for data fetching
  const workbenchQuery = usePricingWorkbench({
    limit: pagination.limit,
    offset: pagination.offset,
    q: debouncedSearch || undefined,
  });
  const rulesQuery = usePricingRules();
  const historyQuery = usePriceHistory({ limit: 50 });

  const items = workbenchQuery.data?.items ?? [];
  const stats = workbenchQuery.data?.stats ?? null;
  const rules = rulesQuery.data?.rules ?? [];
  const history = historyQuery.data?.changes ?? [];
  const loading = workbenchQuery.isLoading;
  const count = workbenchQuery.data?.count ?? 0;

  // Mutations
  const bulkUpdateMutation = useBulkUpdatePrices();
  const activateRuleMutation = useActivatePricingRule();
  const deactivateRuleMutation = useDeactivatePricingRule();
  const deleteRuleMutation = useDeletePricingRule();

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: PricingRuleDto) => {
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleToggleRuleStatus = (rule: PricingRuleDto) => {
    const mutation = rule.isActive ? deactivateRuleMutation : activateRuleMutation;
    mutation.mutate(rule.id, {
      onSuccess: () => {
        toast.success(rule.isActive ? "Rule deactivated" : "Rule activated");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to update rule");
      },
    });
  };

  const handleDeleteRule = (rule: PricingRuleDto) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRule = () => {
    if (!ruleToDelete) return;
    deleteRuleMutation.mutate(ruleToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setRuleToDelete(null);
        toast.success("Rule deleted");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete rule");
      },
    });
  };

  const handleRuleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["pricing"] });
  };

  // =========================================================================
  // Keyboard Shortcuts
  // =========================================================================

  useRegisterShortcut(
    "pricing-save",
    pendingChanges.size > 0 ? { ...SHORTCUTS.SAVE, description: "Save price changes" } : null,
    () => {
      if (pendingChanges.size > 0 && !saving) {
        handleSaveChanges();
      }
    },
    "pricing"
  );

  useRegisterShortcut(
    "pricing-new-rule",
    { ...SHORTCUTS.NEW, description: "Create new pricing rule" },
    () => {
      if (!ruleDialogOpen) {
        handleCreateRule();
      }
    },
    "pricing"
  );

  useRegisterShortcut(
    "pricing-refresh",
    { ...SHORTCUTS.REFRESH, description: "Refresh pricing data" },
    () => {
      if (!loading) {
        queryClient.invalidateQueries({ queryKey: ["pricing"] });
      }
    },
    "pricing"
  );

  useRegisterShortcut(
    "pricing-discard",
    pendingChanges.size > 0 ? { key: "Escape", description: "Discard pending changes" } : null,
    () => {
      if (pendingChanges.size > 0 && !ruleDialogOpen) {
        handleDiscardChanges();
      }
    },
    "pricing"
  );

  const handlePriceChange = (variantId: string, originalPrice: number, newValue: string) => {
    const numericValue = parseFloat(newValue.replace(/[^0-9.]/g, ""));
    if (isNaN(numericValue)) return;

    const newPriceCents = Math.round(numericValue * 100);
    const existing = pendingChanges.get(variantId);

    if (newPriceCents === originalPrice && !existing?.compareAtPrice) {
      const newChanges = new Map(pendingChanges);
      newChanges.delete(variantId);
      setPendingChanges(newChanges);
    } else {
      setPendingChanges(
        new Map(pendingChanges).set(variantId, {
          variantId,
          originalPrice,
          newPrice: newPriceCents,
          compareAtPrice: existing?.compareAtPrice,
        })
      );
    }
  };

  const handleCompareAtChange = (variantId: string, originalPrice: number, newValue: string) => {
    const numericValue = newValue ? parseFloat(newValue.replace(/[^0-9.]/g, "")) : 0;
    const compareAtCents = isNaN(numericValue) ? undefined : Math.round(numericValue * 100);
    const existing = pendingChanges.get(variantId);

    setPendingChanges(
      new Map(pendingChanges).set(variantId, {
        variantId,
        originalPrice,
        newPrice: existing?.newPrice ?? originalPrice,
        compareAtPrice: compareAtCents || undefined,
      })
    );
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    setError(null);

    const updates = Array.from(pendingChanges.values()).map((change) => ({
      variantId: change.variantId,
      amount: change.newPrice,
      compareAtPrice: change.compareAtPrice,
    }));

    bulkUpdateMutation.mutate(
      { updates },
      {
        onSuccess: (result) => {
          if (result.successCount > 0) {
            const newChanges = new Map(pendingChanges);
            result.changes.forEach((change) => {
              newChanges.delete(change.variantId);
            });
            setPendingChanges(newChanges);
          }
          if (result.failureCount > 0) {
            setError(`${result.failureCount} updates failed`);
          }
          setSaving(false);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to save changes");
          setSaving(false);
        },
      }
    );
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
  };

  const toggleSelectItem = (variantId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.variantId)));
    }
  };

  const getPriceDisplay = (item: WorkbenchItem) => {
    const pending = pendingChanges.get(item.variantId);
    if (pending) {
      return pending.newPrice / 100;
    }
    return item.currentPrice / 100;
  };

  const hasPriceChanged = (variantId: string) => pendingChanges.has(variantId);

  const togglingRuleId = activateRuleMutation.isPending
    ? (activateRuleMutation.variables as string)
    : deactivateRuleMutation.isPending
    ? (deactivateRuleMutation.variables as string)
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pricing Workbench</h1>
            {isConnected ? (
              <Badge
                variant="outline"
                className="gap-1 border-green-300/80 bg-green-500/10 text-green-700 dark:border-green-500/40 dark:text-green-300"
              >
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Bulk edit prices, manage pricing rules, and track changes
          </p>
        </div>
        {pendingChanges.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-300/80 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
            >
              {pendingChanges.size} unsaved changes
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDiscardChanges} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Discard
              <kbd className="ml-2 hidden sm:inline-flex kbd">Esc</kbd>
            </Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save"}
              <kbd className="ml-2 hidden sm:inline-flex kbd">{formatShortcut(SHORTCUTS.SAVE)}</kbd>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVariants.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Discount</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.variantsWithDiscount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalVariants > 0
                  ? Math.round((stats.variantsWithDiscount / stats.totalVariants) * 100)
                  : 0}
                % of products
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageMargin != null ? `${stats.averageMargin}%` : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content with Tabs */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs defaultValue="editor" className="space-y-4">
            <TabsList>
              <TabsTrigger value="editor">Bulk Editor</TabsTrigger>
              <TabsTrigger value="rules">Pricing Rules ({rules.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Bulk Editor Tab */}
            <TabsContent value="editor" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Price Editor</CardTitle>
                      <CardDescription>
                        Click on a price to edit. Changes are saved in bulk.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["pricing", "workbench"] })}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300/60 bg-red-100/70 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["pricing", "workbench"] })}
                        className="ml-auto"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {loading && items.length === 0 ? (
                    <div className="space-y-3">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectedItems.size === items.length && items.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="w-[60px]">Image</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Compare At</TableHead>
                          <TableHead className="text-right">New Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No products found
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item) => (
                            <TableRow
                              key={item.variantId}
                              className={
                                hasPriceChanged(item.variantId)
                                  ? "bg-amber-100/70 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                                  : ""
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.has(item.variantId)}
                                  onCheckedChange={() => toggleSelectItem(item.variantId)}
                                />
                              </TableCell>
                              <TableCell>
                                {item.thumbnail ? (
                                  <img
                                    src={getImageUrl(item.thumbnail) || ""}
                                    alt={item.productTitle}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">-</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.productTitle}</span>
                                  <span className="text-xs text-muted-foreground">{item.variantTitle}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground font-mono text-sm">
                                {item.sku || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(item.currentPrice / 100, item.currencyCode)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-muted-foreground">&pound;</span>
                                  <Input
                                    type="text"
                                    className={`w-24 text-right ${
                                      pendingChanges.get(item.variantId)?.compareAtPrice
                                        ? "border-amber-400 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/20"
                                        : ""
                                    }`}
                                    placeholder="-"
                                    value={
                                      pendingChanges.get(item.variantId)?.compareAtPrice
                                        ? (pendingChanges.get(item.variantId)!.compareAtPrice! / 100).toFixed(2)
                                        : item.compareAtPrice
                                          ? (item.compareAtPrice / 100).toFixed(2)
                                          : ""
                                    }
                                    onChange={(e) =>
                                      handleCompareAtChange(item.variantId, item.currentPrice, e.target.value)
                                    }
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-muted-foreground">&pound;</span>
                                  <Input
                                    type="text"
                                    className={`w-24 text-right ${
                                      hasPriceChanged(item.variantId)
                                        ? "border-amber-400 bg-amber-50 text-amber-950 placeholder:text-amber-800/60 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100 dark:placeholder:text-amber-200/60"
                                        : ""
                                    }`}
                                    value={getPriceDisplay(item).toFixed(2)}
                                    onChange={(e) =>
                                      handlePriceChange(item.variantId, item.currentPrice, e.target.value)
                                    }
                                  />
                                  {hasPriceChanged(item.variantId) && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        pendingChanges.get(item.variantId)!.newPrice > item.currentPrice
                                          ? "border-green-300/80 bg-green-100/70 text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300"
                                          : "border-red-300/80 bg-red-100/70 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                                      }
                                    >
                                      {pendingChanges.get(item.variantId)!.newPrice > item.currentPrice ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3" />
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}

                  {/* Pagination */}
                  {count > pagination.limit && (
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>
                        {pagination.offset + 1} &mdash; {Math.min(pagination.offset + pagination.limit, count)}{" "}
                        of {count} variants
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pagination.offset === 0}
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              offset: Math.max(0, prev.offset - prev.limit),
                            }))
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pagination.offset + pagination.limit >= count}
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              offset: prev.offset + prev.limit,
                            }))
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Rules Tab */}
            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pricing Rules</CardTitle>
                      <CardDescription>
                        Automatic pricing rules that apply to products
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={handleCreateRule}>
                      <Zap className="h-4 w-4 mr-1" />
                      Create Rule
                      <kbd className="ml-2 hidden sm:inline-flex kbd">{formatShortcut(SHORTCUTS.NEW)}</kbd>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {rules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pricing rules configured
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Targets</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule) => {
                          const typeDisplay = getPricingRuleTypeDisplay(rule.type);
                          const statusDisplay = getPricingRuleStatusDisplay(rule.status);
                          return (
                            <TableRow key={rule.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{rule.name}</span>
                                  {rule.description && (
                                    <span className="text-xs text-muted-foreground">{rule.description}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={typeDisplay.color}>{typeDisplay.label}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusDisplay.color}>{statusDisplay.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {rule.targetType === "ALL" ? (
                                  <span className="text-muted-foreground">All products</span>
                                ) : (
                                  `${rule.targetCount} ${rule.targetType?.toLowerCase() || "items"}`
                                )}
                              </TableCell>
                              <TableCell>{rule.priority}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleToggleRuleStatus(rule)}
                                      disabled={togglingRuleId === rule.id}
                                    >
                                      {rule.isActive ? (
                                        <>
                                          <PowerOff className="h-4 w-4 mr-2" />
                                          {togglingRuleId === rule.id ? "Deactivating..." : "Deactivate"}
                                        </>
                                      ) : (
                                        <>
                                          <Power className="h-4 w-4 mr-2" />
                                          {togglingRuleId === rule.id ? "Activating..." : "Activate"}
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteRule(rule)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
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
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Price Change History</CardTitle>
                  <CardDescription>Recent price changes across all products</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No price changes recorded
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Previous</TableHead>
                          <TableHead>New</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((change) => {
                          const typeDisplay = getPriceChangeTypeDisplay(change.changeType);
                          return (
                            <TableRow key={change.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{change.productTitle}</span>
                                  <span className="text-xs text-muted-foreground">{change.variantTitle}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {change.previousPrice != null
                                  ? formatPrice(change.previousPrice / 100, change.currencyCode)
                                  : "-"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatPrice(change.newPrice / 100, change.currencyCode)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={
                                    change.priceDifference > 0
                                      ? "text-green-700 dark:text-green-300"
                                      : change.priceDifference < 0
                                      ? "text-red-700 dark:text-red-300"
                                      : ""
                                  }
                                >
                                  {change.priceDifference > 0 ? "+" : ""}
                                  {formatPrice(change.priceDifference / 100, change.currencyCode)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={typeDisplay.color}>{typeDisplay.label}</span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDateTime(change.changedAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Activity Feed Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Live Activity</CardTitle>
                {isConnected ? (
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                ) : (
                  <span className="flex h-2 w-2 rounded-full bg-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                events.slice(0, 10).map((event, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {event.type === "PRICE_CHANGED" && (
                        <Tag className="h-4 w-4 text-blue-500" />
                      )}
                      {event.type === "BULK_UPDATE" && (
                        <Zap className="h-4 w-4 text-purple-500" />
                      )}
                      {event.type.startsWith("RULE_") && (
                        <Percent className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {event.type === "PRICE_CHANGED" && (
                          <>
                            <span className="font-medium">{event.productTitle}</span> price updated
                          </>
                        )}
                        {event.type === "BULK_UPDATE" && (
                          <>{event.count} prices updated</>
                        )}
                        {event.type === "RULE_CREATED" && (
                          <>
                            Rule <span className="font-medium">{event.ruleName}</span> created
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Rule Dialog */}
      <PricingRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        rule={editingRule}
        onSuccess={handleRuleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{ruleToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRule} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
