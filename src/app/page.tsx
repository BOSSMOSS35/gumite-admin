"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatPrice } from "@/lib/api";

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function TodayPage() {
  const { stats, isLoading, isError, refetch } = useDashboard();

  const tasks = stats
    ? [
        { label: "Orders that need action", count: stats.orders.requiresAction, href: "/orders" },
        { label: "Orders to process", count: stats.orders.pending + stats.orders.processing, href: "/orders" },
        { label: "Products low on stock", count: stats.products.lowStock, href: "/inventory" },
      ]
    : [];
  const open = tasks.filter((t) => t.count > 0);

  const revenueChange = stats ? stats.revenue.today - stats.revenue.yesterday : 0;

  return (
    <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Today</h1>

      {isError ? (
        <div className="mt-6 border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">The dashboard couldn&apos;t load.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          <section aria-labelledby="todo" className="mt-6">
            <h2 id="todo" className="sr-only">To do</h2>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : open.length === 0 ? (
              <p className="border border-border p-5 text-sm text-muted-foreground">Nothing needs your attention right now.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {open.map((t) => (
                  <li key={t.label}>
                    <Link href={t.href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted">
                      <span>{t.label}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-lg font-semibold tabular-nums">{t.count}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="sales" className="mt-10">
            <h2 id="sales" className="text-base font-semibold">Sales</h2>
            {isLoading || !stats ? (
              <Skeleton className="mt-3 h-20 w-full" />
            ) : (
              <dl className="mt-3 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                <div className="bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Revenue today</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{formatPrice(stats.revenue.today)}</dd>
                  <dd className="text-sm text-muted-foreground tabular-nums">
                    {revenueChange === 0 ? "Same as yesterday" : `${revenueChange > 0 ? "+" : "−"}${formatPrice(Math.abs(revenueChange))} vs yesterday`}
                  </dd>
                </div>
                <div className="bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Orders today</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{stats.orders.today}</dd>
                </div>
                <div className="bg-background p-4">
                  <dt className="text-sm text-muted-foreground">New customers this week</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{stats.customers.newThisWeek}</dd>
                </div>
                <div className="bg-background p-4">
                  <dt className="text-sm text-muted-foreground">Products</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{stats.products.total}</dd>
                </div>
              </dl>
            )}
          </section>

          <section aria-labelledby="recent" className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 id="recent" className="text-base font-semibold">Recent orders</h2>
              <Link href="/orders" className="text-sm underline underline-offset-4 hover:text-muted-foreground">All orders</Link>
            </div>
            {isLoading || !stats ? (
              <Skeleton className="mt-3 h-48 w-full" />
            ) : stats.recentOrders.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Payment</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Fulfilment</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentOrders.slice(0, 8).map((o) => (
                      <tr key={o.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">#{o.displayId}</Link>
                          <span className="block text-muted-foreground">{new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </td>
                        <td className="px-4 py-3">{o.customerName}</td>
                        <td className="px-4 py-3">{statusLabel(o.paymentStatus)}</td>
                        <td className="px-4 py-3">{statusLabel(o.fulfillmentStatus)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatPrice(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
