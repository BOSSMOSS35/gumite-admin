import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OrderStatusChart } from "@/components/dashboard/order-status-chart";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock data - in real app, this would come from API
const metrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up" as const,
    icon: DollarSign,
    description: "from last month",
  },
  {
    title: "Orders",
    value: "2,350",
    change: "+15.2%",
    trend: "up" as const,
    icon: ShoppingCart,
    description: "from last month",
  },
  {
    title: "Customers",
    value: "12,234",
    change: "+10.5%",
    trend: "up" as const,
    icon: Users,
    description: "from last month",
  },
  {
    title: "Active Products",
    value: "573",
    change: "-2.4%",
    trend: "down" as const,
    icon: Package,
    description: "from last month",
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "Olivia Martin",
    email: "olivia@example.com",
    product: "Hermès Birkin 25",
    amount: "$12,500.00",
    status: "completed",
  },
  {
    id: "ORD-002",
    customer: "Jackson Lee",
    email: "jackson@example.com",
    product: "Chanel Classic Flap",
    amount: "$8,200.00",
    status: "processing",
  },
  {
    id: "ORD-003",
    customer: "Isabella Nguyen",
    email: "isabella@example.com",
    product: "Louis Vuitton Neverfull",
    amount: "$2,100.00",
    status: "completed",
  },
  {
    id: "ORD-004",
    customer: "William Kim",
    email: "will@example.com",
    product: "Gucci Dionysus",
    amount: "$3,450.00",
    status: "pending",
  },
  {
    id: "ORD-005",
    customer: "Sofia Davis",
    email: "sofia@example.com",
    product: "Dior Lady Dior",
    amount: "$5,800.00",
    status: "completed",
  },
];

const topProducts = [
  {
    name: "Hermès Birkin 25",
    brand: "Hermès",
    sales: 45,
    revenue: "$562,500",
  },
  {
    name: "Chanel Classic Flap",
    brand: "Chanel",
    sales: 38,
    revenue: "$311,600",
  },
  {
    name: "Louis Vuitton Neverfull",
    brand: "Louis Vuitton",
    sales: 52,
    revenue: "$109,200",
  },
  {
    name: "Gucci Dionysus",
    brand: "Gucci",
    sales: 29,
    revenue: "$100,050",
  },
  {
    name: "Dior Lady Dior",
    brand: "Dior",
    sales: 24,
    revenue: "$139,200",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={metric.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {metric.change}
                </span>
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>
              Distribution of orders by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusChart />
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <a
              href="/orders"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </div>
            <a
              href="/products"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-right font-medium">
                      {product.revenue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
