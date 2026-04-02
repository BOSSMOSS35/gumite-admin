"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  SlidersHorizontal,
  Plus,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PaymentStatus,
  FulfillmentStatus,
  formatPrice,
  formatDate,
  getPaymentStatusDisplay,
  getFulfillmentStatusDisplay,
  createDraftOrder,
} from "@/lib/api";
import { useOrders } from "@/hooks/use-orders";
import { useOrderStore } from "@/stores/order-store";

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, color } = getPaymentStatusDisplay(status);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const { label, color } = getFulfillmentStatusDisplay(status);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function OrdersPage() {
  // ─── Zustand: client-only UI state ──────────────────────
  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    dateFrom,
    dateTo,
    setDateRange,
    limit,
    offset,
    setOffset,
  } = useOrderStore();

  // Create order state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    note: "",
    itemTitle: "",
    itemQty: 1,
    itemPrice: 0,
  });

  // Derive API filter params from active filter chips
  const paymentFilter = activeFilters.find((f) => f.id === "payment")?.value;
  const fulfillmentFilter = activeFilters.find((f) => f.id === "fulfillment")?.value;

  // ─── Debounced search value ─────────────────────────────
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // ─── React Query: server state ──────────────────────────
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrders({
    limit,
    offset,
    q: debouncedSearch || undefined,
    payment_status: paymentFilter,
    fulfillment_status: fulfillmentFilter,
    created_after: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    created_before: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
  });

  const orders = data?.orders ?? [];
  const count = data?.count ?? 0;

  const totalPages = Math.ceil(count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit);
  };

  const handleExport = () => {
    try {
      const headers = ["Order", "Date", "Customer", "Payment", "Fulfillment", "Order Total"];
      const rows = orders.map((order) => [
        `#${order.displayId}`,
        formatDate(order.createdAt),
        order.email,
        order.paymentStatus,
        order.fulfillmentStatus,
        formatPrice(order.total, order.currencyCode),
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export complete");
    } catch {
      toast.error("Failed to export orders");
    }
  };

  const handleCreateOrder = async () => {
    if (!createForm.email || !createForm.itemTitle || createForm.itemPrice <= 0) {
      setCreateError("Email, item title, and price are required");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createDraftOrder({
        email: createForm.email,
        note: createForm.note || undefined,
        items: [{
          title: createForm.itemTitle,
          quantity: createForm.itemQty,
          unitPrice: Math.round(createForm.itemPrice * 100), // convert to minor units
        }],
      });
      setIsCreateOpen(false);
      setCreateForm({ email: "", note: "", itemTitle: "", itemQty: 1, itemPrice: 0 });
      toast.success("Draft order created");
      refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={orders.length === 0}>
              Export
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Add Filter Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2 px-2">Filter by</p>

                    {/* Payment Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Payment Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["NOT_PAID", "AWAITING", "CAPTURED", "PAID", "REFUNDED"] as PaymentStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "payment" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "payment", label: `Payment: ${getPaymentStatusDisplay(status).label}`, value: status });
                              else removeFilter("payment", status);
                            }}
                          >
                            {getPaymentStatusDisplay(status).label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fulfillment Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Fulfillment Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["NOT_FULFILLED", "FULFILLED", "SHIPPED", "RETURNED"] as FulfillmentStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "fulfillment" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "fulfillment", label: `Fulfillment: ${getFulfillmentStatusDisplay(status).label}`, value: status });
                              else removeFilter("fulfillment", status);
                            }}
                          >
                            {getFulfillmentStatusDisplay(status).label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Date Range Filter */}
                    <div className="px-2 pt-2 border-t">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Date Range
                      </p>
                      <div className="grid gap-2">
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={dateFrom || ""}
                          onChange={(e) => setDateRange(e.target.value || null, dateTo)}
                          placeholder="From"
                        />
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={dateTo || ""}
                          onChange={(e) => setDateRange(dateFrom, e.target.value || null)}
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active Filters */}
              {activeFilters.map((filter) => (
                <div
                  key={`${filter.id}-${filter.value}`}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.id, filter.value)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Date filter chip */}
              {(dateFrom || dateTo) && (
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {dateFrom && dateTo
                      ? `${dateFrom} — ${dateTo}`
                      : dateFrom
                        ? `From ${dateFrom}`
                        : `Until ${dateTo}`}
                  </span>
                  <button
                    onClick={() => setDateRange(null, null)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {(activeFilters.length > 0 || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setDateRange(null, null); }}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="Reset filters and search"
                disabled={activeFilters.length === 0 && searchQuery.trim().length === 0}
                onClick={() => {
                  clearFilters();
                  setSearchQuery("");
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error State */}
          {isError && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : "Failed to load orders"}</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Orders Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={ShoppingCart}
                          title={count === 0 && !searchQuery && activeFilters.length === 0 ? "No orders yet" : "No orders match your filters"}
                          description={count === 0 && !searchQuery && activeFilters.length === 0
                            ? "Orders will appear here when customers make purchases."
                            : "Try adjusting your search or filter criteria."}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => (window.location.href = `/orders/${order.id}`)}
                      >
                        <TableCell className="font-medium">#{order.displayId}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.email}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TableCell>
                        <TableCell>
                          <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.total, order.currencyCode)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  {count > 0
                    ? `${offset + 1} — ${Math.min(offset + limit, count)} of ${count} results`
                    : "0 results"}
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {currentPage} of {totalPages || 1} pages
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Draft Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Create Draft Order
            </DialogTitle>
            <DialogDescription>
              Manually create a draft order. You can fulfill and capture payment later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="order-email">Customer Email *</Label>
              <Input
                id="order-email"
                type="email"
                placeholder="customer@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Line Item</p>
              <div className="grid gap-2">
                <Label htmlFor="item-title">Item Title *</Label>
                <Input
                  id="item-title"
                  placeholder="e.g. Custom alterations"
                  value={createForm.itemTitle}
                  onChange={(e) => setCreateForm((f) => ({ ...f, itemTitle: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="item-qty">Quantity</Label>
                  <Input
                    id="item-qty"
                    type="number"
                    min={1}
                    value={createForm.itemQty}
                    onChange={(e) => setCreateForm((f) => ({ ...f, itemQty: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="item-price">Unit Price (GBP) *</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={createForm.itemPrice || ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, itemPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-note">Note (optional)</Label>
              <Textarea
                id="order-note"
                placeholder="Internal note about this order..."
                value={createForm.note}
                onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={createLoading}>
              {createLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Draft Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tiny debounce hook (no useEffect for data fetching) ──
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
