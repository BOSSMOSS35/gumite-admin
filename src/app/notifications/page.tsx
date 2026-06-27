"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Package,
  User,
  CreditCard,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-notifications";
import type { Notification } from "@/lib/api";

// Get icon for notification type with soft background colors
function getNotificationIcon(eventType: string) {
  switch (eventType) {
    case "ORDER_CREATED":
    case "ORDER_PAID":
    case "ORDER_CANCELLED":
    case "ORDER_FULFILLED":
    case "REFUND_CREATED":
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500">
          <Package className="h-5 w-5" />
        </div>
      );
    case "CUSTOMER_REGISTERED":
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-500/10 text-green-500">
          <User className="h-5 w-5" />
        </div>
      );
    case "LOW_STOCK_ALERT":
    case "PRODUCT_OUT_OF_STOCK":
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
      );
    case "FULFILLMENT_CREATED":
    case "FULFILLMENT_SHIPPED":
    case "FULFILLMENT_DELIVERED":
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500">
          <CreditCard className="h-5 w-5" />
        </div>
      );
    case "SECURITY_ALERT":
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 text-red-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-500/10 text-gray-500">
          <Bell className="h-5 w-5" />
        </div>
      );
  }
}

// Get badge variant for event type
function getEventBadgeVariant(eventType: string): "default" | "secondary" | "destructive" | "outline" {
  if (eventType.includes("CANCELLED") || eventType.includes("ALERT")) {
    return "destructive";
  }
  if (eventType.includes("CREATED") || eventType.includes("REGISTERED")) {
    return "default";
  }
  return "secondary";
}

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  
  // Format nicely for older dates e.g. "Oct 24, 2026"
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Notification row component
function NotificationRow({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: () => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    onClick();
  };

  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        className={cn(
          "flex w-full items-start gap-4 p-5 text-left transition-all duration-200 rounded-2xl",
          "hover:bg-muted/40",
          !notification.isRead && "bg-blue-50/30 hover:bg-blue-50/50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20"
        )}
      >
        <div className="flex-shrink-0 mt-0.5 relative">
          {getNotificationIcon(notification.eventType)}
          {!notification.isRead && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border-2 border-background"></span>
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className={cn("text-base", !notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
              {notification.title}
            </h4>
            <Badge variant={getEventBadgeVariant(notification.eventType)} className="text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 shadow-none">
              {formatEventType(notification.eventType)}
            </Badge>
          </div>
          
          {notification.message && (
            <p className={cn(
              "text-sm line-clamp-2 leading-relaxed mb-2",
              !notification.isRead ? "text-foreground/80" : "text-muted-foreground"
            )}>
              {notification.message}
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground font-medium">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0 justify-center h-full self-center">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            "group-hover:bg-background/80 group-hover:shadow-sm"
          )}>
            <ChevronRight className={cn(
              "h-5 w-5 transition-colors",
              notification.isRead ? "text-muted-foreground/30 group-hover:text-muted-foreground" : "text-blue-500/50 group-hover:text-blue-500"
            )} />
          </div>
        </div>
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useNotifications(100);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Filter notifications based on selection
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle click on notification
  const handleNotificationClick = (notification: Notification) => {
    if (notification.navigateTo) {
      router.push(notification.navigateTo);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onSuccess: () => {
        toast.success("Marked as read");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to mark notification as read");
      },
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to mark all notifications as read");
      },
    });
  };

  return (
    <div className="container max-w-4xl py-10 px-6">
      {/* Dynamic Header */}
      <div className="relative mb-8 p-6 rounded-3xl overflow-hidden bg-gradient-to-r from-background to-muted/30 border shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Bell className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            </div>
            <p className="text-muted-foreground/80 text-base max-w-md">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} requiring your attention.`
                : "You're all caught up! No new notifications."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="h-9 px-4 rounded-full font-medium"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-2 text-blue-500" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Tabs replacing the Select dropdown */}
      <div className="mb-6 flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-full p-1 bg-muted/50 border">
            <TabsTrigger value="all" className="rounded-full text-sm font-medium transition-all data-[state=active]:shadow-sm">
              All 
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground">
                {notifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-full text-sm font-medium transition-all data-[state=active]:shadow-sm">
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List - Glassmorphism floating look */}
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4 rounded-3xl border border-dashed bg-muted/10">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No notifications found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {filter === "unread"
                ? "You've read all your notifications. Take a break!"
                : "When you receive notifications, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onRead={handleMarkAsRead}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
