"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrderStore, type OrderFilter } from "@/stores/order-store";

function humanise(v: string) {
  return v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Keeps the orders list state (search, filters, dates, page) in the URL so a
 * filtered view survives refresh and Back, and can be shared as a link.
 */
export function OrdersUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const hydrated = useRef(false);
  const { searchQuery, activeFilters, dateFrom, dateTo, offset, limit } = useOrderStore();

  // URL -> store, once on arrival
  useEffect(() => {
    const filters: OrderFilter[] = params.getAll("filter").flatMap((raw) => {
      const i = raw.indexOf(":");
      if (i <= 0) return [];
      const id = raw.slice(0, i);
      const value = raw.slice(i + 1);
      const prefix = id === "payment" ? "Payment" : id === "fulfillment" ? "Fulfillment" : humanise(id);
      return [{ id, value, label: `${prefix}: ${humanise(value)}` }];
    });
    const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
    useOrderStore.setState({
      searchQuery: params.get("q") ?? "",
      activeFilters: filters,
      dateFrom: params.get("from"),
      dateTo: params.get("to"),
      offset: (page - 1) * useOrderStore.getState().limit,
    });
    hydrated.current = true;
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // store -> URL
  useEffect(() => {
    if (!hydrated.current) return;
    const next = new URLSearchParams();
    if (searchQuery) next.set("q", searchQuery);
    activeFilters.forEach((f) => next.append("filter", `${f.id}:${f.value}`));
    if (dateFrom) next.set("from", dateFrom);
    if (dateTo) next.set("to", dateTo);
    const page = Math.floor(offset / limit) + 1;
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    if (qs !== params.toString()) router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchQuery, activeFilters, dateFrom, dateTo, offset, limit, pathname, params, router]);

  return null;
}
