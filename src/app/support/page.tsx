"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  UserX,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/api";
import { useSupportTickets, useSupportStats } from "@/hooks/use-support";

// ── Badge helpers ──────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  open: "border-blue-300/70 bg-blue-100/80 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300",
  awaiting_customer:
    "border-amber-300/70 bg-amber-100/80 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
  awaiting_agent:
    "border-orange-300/70 bg-orange-100/80 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300",
  resolved:
    "border-green-300/70 bg-green-100/80 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300",
  closed:
    "border-zinc-300/70 bg-zinc-100/80 text-zinc-800 dark:border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-300",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  awaiting_customer: "Awaiting Customer",
  awaiting_agent: "Awaiting Agent",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent:
    "border-red-300/70 bg-red-100/80 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300",
  high: "border-orange-300/70 bg-orange-100/80 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300",
  normal:
    "border-zinc-300/70 bg-zinc-100/80 text-zinc-800 dark:border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-300",
  low: "border-zinc-200/70 bg-zinc-50/80 text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-600/10 dark:text-zinc-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? STATUS_STYLES.open}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

// ── Page ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
  };

  const {
    data: ticketsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSupportTickets(queryParams);

  const { data: stats } = useSupportStats();

  const tickets = ticketsData?.tickets ?? [];
  const total = ticketsData?.count ?? 0;
  const hasNextPage = offset + PAGE_SIZE < total;
  const hasPrevPage = offset > 0;

  const statCards = [
    {
      label: "Open",
      value: stats?.open ?? "\u2014",
      icon: MessageSquare,
    },
    {
      label: "Awaiting Response",
      value: stats ? (stats.awaitingAgent + stats.awaitingCustomer) : "\u2014",
      icon: Clock,
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? "\u2014",
      icon: CheckCircle,
    },
    {
      label: "Unassigned",
      value: stats?.unassigned ?? "\u2014",
      icon: UserX,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Manage customer support requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-muted p-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
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
              <Input
                placeholder="Search tickets..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="awaiting_customer">Awaiting Customer</SelectItem>
                <SelectItem value="awaiting_agent">Awaiting Agent</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-center text-red-600">
            {error instanceof Error ? error.message : "Failed to load tickets"}
            <Button variant="link" onClick={() => refetch()} className="ml-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {total} ticket{total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium">No tickets found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Support tickets will appear here when customers submit them.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="max-w-[280px]">
                        <Link href={`/support/${ticket.id}`} className="block">
                          <span className="font-medium hover:underline line-clamp-1">
                            {ticket.subject}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ticket.messageCount} message{ticket.messageCount !== 1 ? "s" : ""}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{ticket.customerName}</span>
                          <span className="text-xs text-muted-foreground">{ticket.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.assignedTo?.name ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.lastMessageAt ? formatDate(ticket.lastMessageAt) : formatDate(ticket.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {offset + 1}\u2013{Math.min(offset + PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevPage}
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNextPage}
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
