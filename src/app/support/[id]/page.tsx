"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Loader2,
  User,
  Headphones,
  Info,
  ShoppingCart,
  Package,
  RotateCcw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/api";
import type { SupportMessage } from "@/lib/api";
import {
  useSupportTicket,
  useReplySupportTicket,
  useUpdateSupportTicketStatus,
} from "@/hooks/use-support";

// ── Badge helpers (same as list page) ──────────────────────────

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

// ── Message bubble ──────────────────────────────────────────────

function MessageBubble({ message }: { message: SupportMessage }) {
  const isAgent = message.senderType === "agent" || message.senderType === "admin";
  const isSystem = message.senderType === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
          {message.body}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isAgent ? "" : "flex-row-reverse"}`}>
      <div className="flex-shrink-0 mt-1">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isAgent
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isAgent ? (
            <Headphones className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
      </div>
      <div className={`flex flex-col max-w-[75%] ${isAgent ? "" : "items-end"}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {message.senderName ?? (isAgent ? "Agent" : "Customer")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <div
          className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
            isAgent
              ? "bg-primary/10 dark:bg-primary/20"
              : "bg-muted"
          }`}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;

  const { data: ticket, isLoading, isError, error } = useSupportTicket(ticketId);
  const replyMutation = useReplySupportTicket();
  const statusMutation = useUpdateSupportTicketStatus();

  const [replyBody, setReplyBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const handleSendReply = () => {
    if (!replyBody.trim() || !ticketId) return;
    replyMutation.mutate(
      { ticketId, body: replyBody.trim() },
      { onSuccess: () => setReplyBody("") }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (!ticketId) return;
    statusMutation.mutate({ ticketId, status: newStatus });
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Info className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-medium">Failed to load ticket</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  if (!ticket) return null;

  const messages = ticket.messages ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/support">Support</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[300px]">
              {ticket.subject}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ticket created {formatDateTime(ticket.createdAt)}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Conversation */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Reply box */}
          <Card>
            <CardContent className="pt-6">
              <Textarea
                placeholder="Type your reply..."
                className="min-h-[100px] resize-none"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSendReply();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Cmd+Enter to send
                </p>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyBody.trim() || replyMutation.isPending}
                  className="gap-2"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={STATUS_STYLES[ticket.status] ?? ""}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <Badge variant="outline" className={PRIORITY_STYLES[ticket.priority] ?? ""}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline">
                  {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <span className="text-sm">{ticket.assignedTo?.name ?? "Unassigned"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{ticket.customerName}</p>
              <p className="text-sm text-muted-foreground">{ticket.customerEmail}</p>
            </CardContent>
          </Card>

          {/* Linked Entities */}
          {(ticket.orderId || ticket.returnId || ticket.productId) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.orderId && (
                  <Link
                    href={`/orders/${ticket.orderId}`}
                    className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Order #{ticket.orderDisplayId ?? ticket.orderId.slice(0, 8)}
                    </span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Link>
                )}
                {ticket.returnId && (
                  <Link
                    href={`/returns/${ticket.returnId}`}
                    className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    <span>Return {ticket.returnId.slice(0, 8)}</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Link>
                )}
                {ticket.productId && (
                  <Link
                    href={`/products/${ticket.productId}`}
                    className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.productTitle ?? "Product"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Change Status</label>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="awaiting_customer">Awaiting Customer</SelectItem>
                    <SelectItem value="awaiting_agent">Awaiting Agent</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(ticket.createdAt)}
                    </p>
                  </div>
                </div>
                {ticket.lastMessageAt && (
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Last Message</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(ticket.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(ticket.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
