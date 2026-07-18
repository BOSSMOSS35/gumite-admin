"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  Warehouse,
  History,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Box,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  useInventoryLevel,
  useInventoryMovements,
} from "@/hooks/use-inventory";
import { getMovementTypeDisplay } from "@/lib/api";

function getStockStatus(available: number, stocked: number) {
  if (stocked === 0) return "out_of_stock";
  if (available <= 2) return "low_stock";
  return "in_stock";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in_stock":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300">In Stock</Badge>;
    case "low_stock":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-amber-500/10 dark:text-amber-300">Low Stock</Badge>;
    case "out_of_stock":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;

  const {
    data: levelData,
    isLoading: isLoadingLevel,
    error: levelError,
  } = useInventoryLevel(id);

  const {
    data: movementsData,
    isLoading: isLoadingMovements,
  } = useInventoryMovements({ inventoryLevelId: id, limit: 50 });

  const level = levelData;
  const movements = movementsData?.movements || [];

  if (isLoadingLevel) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (levelError || !level) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Inventory item not found</p>
        <Button onClick={() => router.push("/inventory")}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  const status = getStockStatus(level.availableQuantity, level.stockedQuantity);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {level.sku || "Inventory Item"}
            </h1>
            {getStatusBadge(status)}
          </div>
          <p className="text-muted-foreground mt-1">
            {level.locationName || "Unknown location"}
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {status !== "in_stock" && (
        <Card className={
          status === "out_of_stock"
            ? "border-red-200 bg-red-50"
            : "border-yellow-200 bg-yellow-50"
        }>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-full p-2 ${
              status === "out_of_stock" ? "bg-red-100" : "bg-yellow-100"
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                status === "out_of_stock" ? "text-red-600" : "text-yellow-600"
              }`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                status === "out_of_stock" ? "text-red-800" : "text-yellow-800"
              }`}>
                {status === "out_of_stock" ? "Out of Stock" : "Low Stock Alert"}
              </p>
              <p className={`text-sm ${
                status === "out_of_stock" ? "text-red-700" : "text-yellow-700"
              }`}>
                {status === "out_of_stock"
                  ? "This item is currently unavailable. Restock immediately to avoid lost sales."
                  : `Only ${level.availableQuantity} units available. Consider restocking soon.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              In Stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{level.stockedQuantity}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total physical inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              level.availableQuantity <= 2 ? "text-yellow-600" : ""
            }`}>
              {level.availableQuantity}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to sell
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Reserved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {level.reservedQuantity}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              In active orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Incoming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {level.incomingQuantity}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Expected soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-mono font-medium">{level.sku || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{level.locationName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/inventory">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="h-4 w-4" />
                View All Inventory
              </Button>
            </Link>
            <Link href="/inventory/locations">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Warehouse className="h-4 w-4" />
                Manage Locations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Stock Movement History
              </CardTitle>
              <CardDescription>
                Recent changes to this inventory item
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMovements ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No movement history</p>
              <p className="text-muted-foreground">
                Stock movements will appear here as inventory changes occur
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const typeDisplay = getMovementTypeDisplay(movement.movementType);
                  const isPositive = movement.quantity > 0;
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Badge className={typeDisplay.color} variant="secondary">
                          {typeDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium flex items-center justify-center gap-1 ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}>
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {isPositive ? "+" : ""}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.reason || movement.note || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(movement.occurredAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
