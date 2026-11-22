"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Tag,
  LogOut,
  Stamp,
  Percent,
  Gift,
  CreditCard,
  Warehouse,
  Loader2,
  RotateCcw,
  Star,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getUserDisplayName, getUserInitials, getRoleDisplayName, getRoleBadgeColor } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavChild = {
  title: string;
  url: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

type NavGroup = { label?: string; items: NavItem[] };

// Grouped by the job staff are doing: selling, stocking, serving customers, promoting.
const navGroups: NavGroup[] = [
  { items: [{ title: "Today", url: "/", icon: LayoutDashboard }] },
  {
    label: "Sell",
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Draft orders", url: "/orders/drafts", icon: ShoppingCart },
      { title: "Returns", url: "/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Collections", url: "/products/collections", icon: Package },
      { title: "Categories", url: "/categories", icon: Tag },
      { title: "Brands", url: "/brands", icon: Stamp },
      { title: "Stock", url: "/inventory", icon: Warehouse },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Customer groups", url: "/customers/groups", icon: Users },
      { title: "Support", url: "/support", icon: MessageSquare },
      { title: "Reviews", url: "/reviews", icon: Star },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Discounts", url: "/discounts", icon: Percent },
      { title: "Gift cards", url: "/gift-cards", icon: Gift },
      { title: "Pricing rules", url: "/pricing", icon: CreditCard },
    ],
  },
];
const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

function UserMenuContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <div className="h-8 w-8 rounded-none bg-muted animate-pulse" />
        <div className="grid flex-1 text-left text-sm leading-tight">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
        </div>
      </>
    );
  }

  return (
    <>
      <Avatar className="h-8 w-8 rounded-none">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {getUserInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{getUserDisplayName(user)}</span>
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
      </div>
    </>
  );
}

function UserMenuDropdown() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <>
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 rounded-none">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{getUserDisplayName(user)}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        {user?.role && (
          <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`} variant="secondary">
            {getRoleDisplayName(user.role)}
          </Badge>
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/settings/profile">
          <Settings className="mr-2 size-4" />
          Profile Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 size-4" />
        )}
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </DropdownMenuItem>
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const allUrls = navItems.map((i) => i.url);
  const isNavActive = (url: string) => {
    if (url === "/") return pathname === "/";
    const matches = allUrls.filter((u) => u !== "/" && (pathname === u || pathname.startsWith(u + "/")));
    const best = matches.sort((a, b) => b.length - a.length)[0];
    return best === url;
  };

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" aria-label="Gumite admin home">
                <span className="flex size-8 items-center justify-center bg-foreground text-sm font-medium text-background">G</span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold uppercase tracking-[0.24em]">Gumite</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, gi) => (
          <SidebarGroup key={group.label ?? gi} className="py-1">
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isNavActive(item.url)} tooltip={item.title}>
                    <Link href={item.url} aria-current={isNavActive(item.url) ? "page" : undefined}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/help")}>
              <Link href="/help">
                <HelpCircle className="size-4" />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <UserMenuContent />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-none"
                side="top"
                align="start"
                sideOffset={4}
              >
                <UserMenuDropdown />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
