import { Metadata } from "next";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  XCircle,
  CheckCircle,
  Download,
  Package,
  Clock,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Orders",
};

// Mock data
const orders = [
  {
    id: "ORD-001",
    customer: {
      name: "Olivia Martin",
      email: "olivia@example.com",
    },
    products: ["Hermès Birkin 25"],
    total: 12500,
    status: "completed",
    paymentStatus: "paid",
    date: "2024-01-15",
    shippingAddress: "123 Main St, New York, NY",
  },
  {
    id: "ORD-002",
    customer: {
      name: "Jackson Lee",
      email: "jackson@example.com",
    },
    products: ["Chanel Classic Flap", "Chanel Wallet"],
    total: 9450,
    status: "processing",
    paymentStatus: "paid",
    date: "2024-01-14",
    shippingAddress: "456 Oak Ave, Los Angeles, CA",
  },
  {
    id: "ORD-003",
    customer: {
      name: "Isabella Nguyen",
      email: "isabella@example.com",
    },
    products: ["Louis Vuitton Neverfull"],
    total: 2100,
    status: "shipped",
    paymentStatus: "paid",
    date: "2024-01-13",
    shippingAddress: "789 Pine Rd, Chicago, IL",
  },
  {
    id: "ORD-004",
    customer: {
      name: "William Kim",
      email: "will@example.com",
    },
    products: ["Gucci Dionysus"],
    total: 3450,
    status: "pending",
    paymentStatus: "pending",
    date: "2024-01-12",
    shippingAddress: "321 Elm St, Houston, TX",
  },
  {
    id: "ORD-005",
    customer: {
      name: "Sofia Davis",
      email: "sofia@example.com",
    },
    products: ["Dior Lady Dior", "Dior Saddle Bag"],
    total: 8900,
    status: "completed",
    paymentStatus: "paid",
    date: "2024-01-11",
    shippingAddress: "654 Maple Dr, Phoenix, AZ",
  },
  {
    id: "ORD-006",
    customer: {
      name: "Liam Johnson",
      email: "liam@example.com",
    },
    products: ["Prada Re-Edition 2005"],
    total: 1950,
    status: "cancelled",
    paymentStatus: "refunded",
    date: "2024-01-10",
    shippingAddress: "987 Cedar Ln, Philadelphia, PA",
  },
  {
    id: "ORD-007",
    customer: {
      name: "Emma Wilson",
      email: "emma@example.com",
    },
    products: ["Bottega Veneta Cassette"],
    total: 3200,
    status: "shipped",
    paymentStatus: "paid",
    date: "2024-01-09",
    shippingAddress: "246 Birch St, San Antonio, TX",
  },
  {
    id: "ORD-008",
    customer: {
      name: "Noah Brown",
      email: "noah@example.com",
    },
    products: ["Celine Triomphe", "Celine Card Holder"],
    total: 3100,
    status: "processing",
    paymentStatus: "paid",
    date: "2024-01-08",
    shippingAddress: "135 Spruce Ave, San Diego, CA",
  },
];

const orderStats = [
  { label: "All Orders", value: orders.length, icon: Package },
  { label: "Pending", value: orders.filter((o) => o.status === "pending").length, icon: Clock },
  { label: "Processing", value: orders.filter((o) => o.status === "processing").length, icon: AlertCircle },
  { label: "Shipped", value: orders.filter((o) => o.status === "shipped").length, icon: Truck },
  { label: "Completed", value: orders.filter((o) => o.status === "completed").length, icon: CheckCircle },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case "shipped":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Shipped</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getPaymentBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge variant="outline" className="border-green-500 text-green-600">Paid</Badge>;
    case "pending":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
    case "refunded":
      return <Badge variant="outline" className="border-gray-500 text-gray-600">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function OrdersTable({ orders: ordersList }: { orders: typeof orders }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Products</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordersList.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{order.customer.name}</span>
                <span className="text-xs text-muted-foreground">
                  {order.customer.email}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{order.products[0]}</span>
                {order.products.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{order.products.length - 1} more
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
              ${order.total.toLocaleString()}
            </TableCell>
            <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
            <TableCell>{getStatusBadge(order.status)}</TableCell>
            <TableCell className="text-muted-foreground">{order.date}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Truck className="mr-2 h-4 w-4" />
                    Update Shipping
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track your customer orders
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Orders
        </Button>
      </div>

      {/* Order Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {orderStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-muted p-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and manage all orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <OrdersTable orders={orders} />
            </TabsContent>
            <TabsContent value="pending">
              <OrdersTable orders={orders.filter((o) => o.status === "pending")} />
            </TabsContent>
            <TabsContent value="processing">
              <OrdersTable orders={orders.filter((o) => o.status === "processing")} />
            </TabsContent>
            <TabsContent value="shipped">
              <OrdersTable orders={orders.filter((o) => o.status === "shipped")} />
            </TabsContent>
            <TabsContent value="completed">
              <OrdersTable orders={orders.filter((o) => o.status === "completed")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
