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
  }, [isAuthenticated, isPublicRoute, pathname]);

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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
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
              <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
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
