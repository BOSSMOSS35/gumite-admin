"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationHandlerProvider } from "@/hooks/use-notification-handler";
import { IssueReporter } from "@/components/issue-reporter";
import { useAuth } from "@/hooks/use-auth";
import { getTaxSetupStatus } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

// Routes that don't show the sidebar/header
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/set-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const [isSetupChecking, setIsSetupChecking] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  const isSetupRoute =
    pathname?.startsWith("/settings/regions") ||
    pathname?.startsWith("/settings/tax-regions") ||
    pathname?.startsWith("/settings/store") ||
    pathname?.startsWith("/settings");

  useEffect(() => {
    if (isPublicRoute || !isAuthenticated) {
      setIsSetupChecking(false);
      setIsSetupRequired(false);
      return;
    }

    let cancelled = false;

    const checkSetup = async () => {
      try {
        setIsSetupChecking(true);
        const status = await getTaxSetupStatus();
        if (cancelled) return;
        setIsSetupRequired(!status.isReady);
      } catch {
        // Avoid blocking navigation when setup check fails unexpectedly.
        if (!cancelled) {
          setIsSetupRequired(false);
        }
      } finally {
        if (!cancelled) {
          setIsSetupChecking(false);
        }
      }
    };

    checkSetup();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute || !isAuthenticated) return;
    if (isSetupChecking) return;
    if (!isSetupRequired) return;
    if (isSetupRoute) return;

    router.replace("/settings/regions?setup=required");
  }, [isPublicRoute, isAuthenticated, isSetupChecking, isSetupRequired, isSetupRoute, router]);

  // Public routes: render immediately without sidebar — no auth checks needed
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isSetupChecking && !isSetupRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking tax and region setup...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and not on public route: show nothing (redirect happens in auth-context)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Breadcrumbs follow the URL: /orders/abc/ship -> Orders / Order / Ship
  const crumbs = (() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Today", href: "/" }];
    const LABELS: Record<string, string> = {
      products: "Products", orders: "Orders", drafts: "Drafts", returns: "Returns", customers: "Customers",
      groups: "Groups", inventory: "Stock", locations: "Locations", categories: "Categories", brands: "Brands",
      collections: "Collections", discounts: "Discounts", "gift-cards": "Gift cards", pricing: "Pricing rules",
      support: "Support", reviews: "Reviews", settings: "Settings", help: "Help", notifications: "Notifications",
      ship: "Ship", new: "New", store: "Store", users: "Team", regions: "Regions", "tax-regions": "Tax regions",
      "product-types": "Product types", "product-tags": "Product tags", "email-templates": "Email templates",
      workflows: "Workflows", security: "Security", profile: "Profile",
    };
    return parts.map((p, i) => ({
      label: LABELS[p] ?? (/^[0-9a-f-]{8,}$/i.test(p) || p.length > 20 ? "Details" : p.charAt(0).toUpperCase() + p.slice(1)),
      href: "/" + parts.slice(0, i + 1).join("/"),
    }));
  })();

  // Authenticated: render with sidebar
  return (
    <NotificationHandlerProvider>
      <SidebarProvider>
        <ConditionalSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.map((c, i) => (
                    <BreadcrumbItem key={c.href}>
                      {i > 0 && <span aria-hidden className="text-muted-foreground">/</span>}
                      {i === crumbs.length - 1 ? (
                        <BreadcrumbPage>{c.label}</BreadcrumbPage>
                      ) : (
                        <Link href={c.href} className="text-muted-foreground hover:text-foreground">{c.label}</Link>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <CommandPalette />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {isSetupRequired && isSetupRoute && (
              <div className="border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning ">
                Region setup is required before using the rest of admin.
                <Link href="/settings/store" className="ml-2 underline underline-offset-2">
                  Configure store
                </Link>
                <Link href="/settings/regions" className="ml-2 underline underline-offset-2">
                  Configure regions
                </Link>
                <Link href="/settings/tax-regions" className="ml-3 underline underline-offset-2">
                  Configure tax rates
                </Link>
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
        <IssueReporter />
      </SidebarProvider>
    </NotificationHandlerProvider>
  );
}
