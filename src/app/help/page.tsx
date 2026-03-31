"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Percent,
  Gift,
  RotateCcw,
  Star,
  Settings,
  Bug,
  ChevronDown,
  ArrowRight,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  items: HelpItem[];
}

interface HelpItem {
  title: string;
  content: React.ReactNode;
  keywords: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: LayoutDashboard,
    badge: "Start Here",
    items: [
      {
        title: "Dashboard Overview",
        keywords: ["dashboard", "overview", "home", "start"],
        content: (
          <div className="space-y-3">
            <p>
              The Dashboard is your central hub for monitoring store performance. At a glance, you can see:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Revenue metrics</strong> — Total sales, average order value, and trends over time.</li>
              <li><strong>Recent orders</strong> — The latest orders with their status and payment details.</li>
              <li><strong>Low stock alerts</strong> — Products that are running low and need restocking.</li>
              <li><strong>Activity feed</strong> — Real-time updates on orders, returns, and customer activity.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              The dashboard refreshes automatically. You can also use the activity feed for live event streaming.
            </p>
          </div>
        ),
      },
      {
        title: "Navigation Guide",
        keywords: ["navigation", "sidebar", "menu", "navigate"],
        content: (
          <div className="space-y-3">
            <p>
              The sidebar on the left provides access to all sections of the admin panel:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Dashboard</strong> — Store overview and metrics.</li>
              <li><strong>Orders</strong> — Manage orders and draft orders.</li>
              <li><strong>Returns</strong> — Process return requests.</li>
              <li><strong>Products</strong> — Product catalog and collections.</li>
              <li><strong>Categories</strong> — Organize products by category.</li>
              <li><strong>Inventory</strong> — Stock levels and warehouse locations.</li>
              <li><strong>Customers</strong> — Customer profiles and groups.</li>
              <li><strong>Discounts</strong> — Discount codes and promotions.</li>
              <li><strong>Gift Cards</strong> — Issue and manage gift cards.</li>
              <li><strong>Reviews</strong> — Moderate customer reviews.</li>
              <li><strong>Settings</strong> — Store configuration, team, regions, and taxes.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Use the keyboard shortcut <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">Ctrl+K</kbd> to open the command palette for quick navigation.
            </p>
          </div>
        ),
      },
      {
        title: "Quick Actions",
        keywords: ["quick", "actions", "shortcuts", "keyboard"],
        content: (
          <div className="space-y-3">
            <p>Speed up your workflow with these quick actions:</p>
            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span>Open Command Palette</span>
                <kbd className="px-2 py-1 text-xs border rounded bg-muted font-mono">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span>Search Products</span>
                <span className="text-sm text-muted-foreground">Command Palette → Type product name</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span>Toggle Theme</span>
                <span className="text-sm text-muted-foreground">Header → Theme toggle button</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span>View Notifications</span>
                <span className="text-sm text-muted-foreground">Header → Bell icon</span>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "products",
    title: "Managing Products",
    icon: Package,
    items: [
      {
        title: "Creating a Product",
        keywords: ["create", "product", "new", "add", "wizard"],
        content: (
          <div className="space-y-3">
            <p>Create products using the 3-step wizard:</p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs">1</Badge>
                <div>
                  <p className="font-medium">Details</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the product title, subtitle, description, handle (URL slug), and material.
                    Choose the product type and set its status (Draft or Published).
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs">2</Badge>
                <div>
                  <p className="font-medium">Organize</p>
                  <p className="text-sm text-muted-foreground">
                    Assign the product to a collection and category. Add tags for filtering and search.
                    Upload product images — drag to reorder, with the first image used as the thumbnail.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs">3</Badge>
                <div>
                  <p className="font-medium">Variants</p>
                  <p className="text-sm text-muted-foreground">
                    Define product options (e.g., Size, Color) and create variants. Set pricing,
                    SKU, barcode, and inventory quantities for each variant.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Navigate to <Link href="/products" className="text-primary underline underline-offset-2">Products</Link> and
              click <strong>Add Product</strong> to get started.
            </p>
          </div>
        ),
      },
      {
        title: "Editing Products",
        keywords: ["edit", "product", "update", "modify"],
        content: (
          <div className="space-y-3">
            <p>To edit a product:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Go to <Link href="/products" className="text-primary underline underline-offset-2">Products</Link>.</li>
              <li>Click on the product you want to edit.</li>
              <li>Modify any field — changes are organized into sections (General, Media, Variants, etc.).</li>
              <li>Click <strong>Save</strong> to apply changes.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              All changes are saved immediately. The product detail page shows a complete history of modifications.
            </p>
          </div>
        ),
      },
      {
        title: "Managing Variants and Pricing",
        keywords: ["variant", "pricing", "price", "sku", "option", "size", "color"],
        content: (
          <div className="space-y-3">
            <p>Each product can have multiple variants based on options like Size, Color, or Material.</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Adding options</strong> — Define option names and values (e.g., Size: S, M, L, XL).</li>
              <li><strong>Variant pricing</strong> — Set a price per variant. Each variant can have its own price in each currency/region.</li>
              <li><strong>SKU &amp; Barcode</strong> — Assign unique identifiers for inventory tracking.</li>
              <li><strong>Stock per variant</strong> — Each variant has independent inventory counts per location.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Uploading Images",
        keywords: ["image", "upload", "photo", "media", "thumbnail"],
        content: (
          <div className="space-y-3">
            <p>Add product images during creation or editing:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Click the upload area or drag and drop images.</li>
              <li>Supported formats: JPEG, PNG, WebP, and GIF.</li>
              <li>The first image becomes the product thumbnail.</li>
              <li>Drag images to reorder them.</li>
              <li>Click the remove button on any image to delete it.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Publishing and Drafting",
        keywords: ["publish", "draft", "status", "live", "hidden"],
        content: (
          <div className="space-y-3">
            <p>Products have two statuses:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><Badge variant="outline">Draft</Badge> — The product is not visible in the storefront. Use this while preparing product details.</li>
              <li><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Published</Badge> — The product is live and visible to customers.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              You can toggle the status at any time from the product detail page.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "orders",
    title: "Managing Orders",
    icon: ShoppingCart,
    items: [
      {
        title: "Order Lifecycle",
        keywords: ["order", "lifecycle", "status", "flow", "new", "processing", "shipped", "delivered"],
        content: (
          <div className="space-y-3">
            <p>Orders progress through these stages:</p>
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Badge variant="outline">New</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Processing</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Shipped</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Delivered</Badge>
            </div>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>New</strong> — Order has been placed and payment confirmed.</li>
              <li><strong>Processing</strong> — Items are being prepared for shipment.</li>
              <li><strong>Shipped</strong> — Order has been dispatched with tracking information.</li>
              <li><strong>Delivered</strong> — Customer has received the order.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Fulfilling Orders",
        keywords: ["fulfill", "fulfillment", "pack", "prepare"],
        content: (
          <div className="space-y-3">
            <p>To fulfill an order:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Open the order from the <Link href="/orders" className="text-primary underline underline-offset-2">Orders</Link> list.</li>
              <li>Review the items and shipping address.</li>
              <li>Click <strong>Create Fulfillment</strong> to mark items as being prepared.</li>
              <li>Once packed, proceed to shipping.</li>
            </ol>
          </div>
        ),
      },
      {
        title: "Shipping an Order",
        keywords: ["ship", "shipping", "tracking", "carrier", "dispatch"],
        content: (
          <div className="space-y-3">
            <p>After fulfillment, ship the order:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Open the order and click <strong>Ship Order</strong>, or navigate directly to the shipping page.</li>
              <li>Enter the tracking number and select the carrier.</li>
              <li>The customer will be notified automatically with tracking details.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Each order has a dedicated shipping page at <code className="px-1.5 py-0.5 text-xs border rounded bg-muted">/orders/[id]/ship</code>.
            </p>
          </div>
        ),
      },
      {
        title: "Canceling Orders",
        keywords: ["cancel", "void", "refund", "cancellation"],
        content: (
          <div className="space-y-3">
            <p>To cancel an order:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Open the order detail page.</li>
              <li>Click <strong>Cancel Order</strong> (available only for orders not yet shipped).</li>
              <li>Confirm the cancellation — the customer will be refunded automatically.</li>
              <li>Inventory will be restocked if applicable.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Canceled orders cannot be restored. If the customer wants to re-order, they will need to place a new order.
            </p>
          </div>
        ),
      },
      {
        title: "Order Tracking",
        keywords: ["tracking", "track", "status", "timeline"],
        content: (
          <div className="space-y-3">
            <p>Each order page includes a timeline view showing:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Order placed timestamp</li>
              <li>Payment confirmation</li>
              <li>Fulfillment creation</li>
              <li>Shipment dispatch with tracking number</li>
              <li>Delivery confirmation</li>
              <li>Any notes or changes made by the team</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "customers",
    title: "Customer Management",
    icon: Users,
    items: [
      {
        title: "Viewing Customers",
        keywords: ["customer", "view", "profile", "list", "search"],
        content: (
          <div className="space-y-3">
            <p>
              The <Link href="/customers" className="text-primary underline underline-offset-2">Customers</Link> page
              shows all registered customers with search and filtering capabilities.
            </p>
            <p>Each customer profile includes:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Contact information and addresses</li>
              <li>Order history and lifetime spend</li>
              <li>Customer tier and loyalty status</li>
              <li>Account status (Active, Suspended)</li>
              <li>Notes added by your team</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Customer Tiers",
        keywords: ["tier", "bronze", "silver", "gold", "platinum", "loyalty", "vip"],
        content: (
          <div className="space-y-3">
            <p>Customers are automatically assigned tiers based on their activity:</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Bronze</Badge>
                <span className="text-sm">New customers — default tier.</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Silver</Badge>
                <span className="text-sm">Repeat customers with moderate spend.</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Gold</Badge>
                <span className="text-sm">High-value customers with consistent purchases.</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Platinum</Badge>
                <span className="text-sm">Top-tier VIP customers.</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Sending Emails and Gift Cards",
        keywords: ["email", "gift card", "send", "communicate", "message"],
        content: (
          <div className="space-y-3">
            <p>From a customer profile, you can:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Send email</strong> — Compose a direct email to the customer using configured email templates.</li>
              <li><strong>Issue gift card</strong> — Create a gift card with a custom balance and send it to the customer.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Email templates can be configured in <Link href="/settings" className="text-primary underline underline-offset-2">Settings</Link>.
            </p>
          </div>
        ),
      },
      {
        title: "Suspending and Activating Accounts",
        keywords: ["suspend", "activate", "block", "ban", "deactivate", "account"],
        content: (
          <div className="space-y-3">
            <p>You can manage customer account status:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Suspend</strong> — Temporarily disable a customer account. Suspended customers cannot log in or place orders.</li>
              <li><strong>Activate</strong> — Re-enable a suspended account, restoring full access.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Suspension does not cancel existing orders. Pending orders will still be fulfilled.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Warehouse,
    items: [
      {
        title: "Stock Levels",
        keywords: ["stock", "level", "quantity", "count", "inventory"],
        content: (
          <div className="space-y-3">
            <p>
              The <Link href="/inventory" className="text-primary underline underline-offset-2">Inventory</Link> page
              shows stock levels across all products and locations.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>View current stock for each variant at each location.</li>
              <li>Filter by location, product, or stock status.</li>
              <li>Low stock items are highlighted automatically.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Adjusting Inventory",
        keywords: ["adjust", "restock", "damaged", "lost", "correction", "reason"],
        content: (
          <div className="space-y-3">
            <p>To adjust stock levels:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Navigate to the inventory item.</li>
              <li>Click <strong>Adjust Stock</strong>.</li>
              <li>Enter the quantity change (positive to add, negative to remove).</li>
              <li>Select a reason for the adjustment:</li>
            </ol>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Badge variant="outline">Restock</Badge>
              <Badge variant="outline">Damaged</Badge>
              <Badge variant="outline">Lost</Badge>
              <Badge variant="outline">Returned</Badge>
              <Badge variant="outline">Correction</Badge>
              <Badge variant="outline">Other</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All adjustments are logged with the reason, quantity, and the team member who made the change.
            </p>
          </div>
        ),
      },
      {
        title: "Stock Locations",
        keywords: ["location", "warehouse", "store", "fulfillment center"],
        content: (
          <div className="space-y-3">
            <p>
              Manage multiple stock locations from{" "}
              <Link href="/inventory/locations" className="text-primary underline underline-offset-2">Inventory &rarr; Locations</Link>.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Add warehouse or store locations with addresses.</li>
              <li>Assign inventory to specific locations.</li>
              <li>Track stock movement between locations.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Low Stock Alerts",
        keywords: ["low stock", "alert", "notification", "threshold", "warning"],
        content: (
          <div className="space-y-3">
            <p>
              The system monitors stock levels and surfaces alerts when inventory runs low:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Low stock warnings appear on the Dashboard.</li>
              <li>Notifications are sent to your notification center.</li>
              <li>Products with zero stock are flagged as <Badge variant="destructive">Out of Stock</Badge>.</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "discounts",
    title: "Discounts & Gift Cards",
    icon: Percent,
    items: [
      {
        title: "Creating Discount Codes",
        keywords: ["discount", "code", "coupon", "create", "promo"],
        content: (
          <div className="space-y-3">
            <p>
              Create discount codes from the{" "}
              <Link href="/discounts" className="text-primary underline underline-offset-2">Discounts</Link> page:
            </p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Click <strong>Create Discount</strong>.</li>
              <li>Enter a discount code (or generate one automatically).</li>
              <li>Choose the discount type and value.</li>
              <li>Set conditions: minimum order amount, specific products/collections, usage limits.</li>
              <li>Set start and end dates for the promotion.</li>
            </ol>
          </div>
        ),
      },
      {
        title: "Discount Types",
        keywords: ["percentage", "fixed", "free shipping", "bogo", "type"],
        content: (
          <div className="space-y-3">
            <p>Available discount types:</p>
            <div className="grid gap-2">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge variant="outline">Percentage</Badge>
                <span className="text-sm">A percentage off the order total (e.g., 20% off).</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge variant="outline">Fixed Amount</Badge>
                <span className="text-sm">A fixed currency amount off the order (e.g., $10 off).</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge variant="outline">Free Shipping</Badge>
                <span className="text-sm">Waives shipping costs for qualifying orders.</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Badge variant="outline">BOGO</Badge>
                <span className="text-sm">Buy one, get one free or at a discount.</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Gift Card Creation and Balance Management",
        keywords: ["gift card", "balance", "create", "manage", "redeem"],
        content: (
          <div className="space-y-3">
            <p>
              Gift cards can be created from the{" "}
              <Link href="/gift-cards" className="text-primary underline underline-offset-2">Gift Cards</Link> page:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Create</strong> — Set the initial balance, region, and optionally assign to a customer.</li>
              <li><strong>View balance</strong> — See the current remaining balance and redemption history.</li>
              <li><strong>Disable</strong> — Deactivate a gift card to prevent further use.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Gift cards are automatically applied at checkout when the customer enters the code.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "returns-reviews",
    title: "Returns & Reviews",
    icon: RotateCcw,
    items: [
      {
        title: "Processing Returns",
        keywords: ["return", "refund", "process", "approve", "receive", "rma"],
        content: (
          <div className="space-y-3">
            <p>Returns follow a structured workflow:</p>
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Badge variant="outline">Requested</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Approved</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Received</Badge>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Refunded</Badge>
            </div>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li><strong>Review the request</strong> — Check the return reason and item condition.</li>
              <li><strong>Approve or reject</strong> — Approve valid returns; reject with a reason if not eligible.</li>
              <li><strong>Receive items</strong> — Mark items as received when they arrive at your location.</li>
              <li><strong>Process refund</strong> — Issue the refund to the original payment method.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Navigate to <Link href="/returns" className="text-primary underline underline-offset-2">Returns</Link> to manage all return requests.
            </p>
          </div>
        ),
      },
      {
        title: "Moderating Reviews",
        keywords: ["review", "moderate", "approve", "reject", "feature", "respond", "star", "rating"],
        content: (
          <div className="space-y-3">
            <p>
              Customer reviews can be managed from the{" "}
              <Link href="/reviews" className="text-primary underline underline-offset-2">Reviews</Link> page:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Approve</strong> — Publish the review on the storefront.</li>
              <li><strong>Reject</strong> — Remove inappropriate or spam reviews (with a reason).</li>
              <li><strong>Feature</strong> — Highlight standout reviews on the product page.</li>
              <li><strong>Respond</strong> — Post a public response to a review as the store.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Use the Pending and Flagged tabs to quickly find reviews that need attention.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "Store Settings",
        keywords: ["store", "settings", "name", "currency", "configuration"],
        content: (
          <div className="space-y-3">
            <p>
              Configure your store from{" "}
              <Link href="/settings/store" className="text-primary underline underline-offset-2">Settings &rarr; Store</Link>:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Store name and description</li>
              <li>Default currency and language</li>
              <li>Contact information</li>
              <li>Business address</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Team Management",
        keywords: ["team", "user", "role", "permission", "invite", "admin", "staff"],
        content: (
          <div className="space-y-3">
            <p>
              Manage your team from{" "}
              <Link href="/settings/users" className="text-primary underline underline-offset-2">Settings &rarr; Team</Link>:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Invite members</strong> — Send invitations via email with a role assignment.</li>
              <li><strong>Roles</strong> — Assign roles (Admin, Manager, Staff) to control access levels.</li>
              <li><strong>Remove members</strong> — Revoke access for team members who no longer need it.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Regions and Tax",
        keywords: ["region", "tax", "rate", "country", "shipping", "zone"],
        content: (
          <div className="space-y-3">
            <p>Regions define where you sell and how taxes and shipping are configured:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Regions</strong> — Define selling regions with currencies and countries.</li>
              <li><strong>Tax rates</strong> — Configure tax rates per region and product type.</li>
              <li><strong>Shipping options</strong> — Set up shipping methods and rates per region.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Region setup is required before processing orders. You will be prompted to configure regions on first login.
            </p>
          </div>
        ),
      },
      {
        title: "Email Templates",
        keywords: ["email", "template", "notification", "customize"],
        content: (
          <div className="space-y-3">
            <p>Customize automated emails sent to customers:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Order confirmation</li>
              <li>Shipment notification with tracking</li>
              <li>Return approval and refund confirmation</li>
              <li>Gift card delivery</li>
              <li>Account welcome email</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Templates support dynamic variables for personalization (customer name, order details, etc.).
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "reporting",
    title: "Reporting Issues",
    icon: Bug,
    items: [
      {
        title: "How to Report a Bug",
        keywords: ["bug", "report", "issue", "problem", "error"],
        content: (
          <div className="space-y-3">
            <p>If you encounter a problem, you can report it directly from the admin panel:</p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Click the <strong>bug icon</strong> button in the bottom-left corner of any page.</li>
              <li>Fill in the issue details — the page URL and browser info are captured automatically.</li>
              <li>Describe the problem and steps to reproduce it.</li>
              <li>Optionally attach a screenshot.</li>
              <li>Submit — your team will be notified.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              All reported issues are saved locally as a backup, even if the submission fails.
            </p>
          </div>
        ),
      },
      {
        title: "Contact Support",
        keywords: ["support", "contact", "help", "email", "assistance"],
        content: (
          <div className="space-y-3">
            <p>For additional assistance:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the issue reporter for bugs and feature requests.</li>
              <li>Check this help page for common workflows and answers.</li>
              <li>Contact your system administrator for account and access issues.</li>
            </ul>
          </div>
        ),
      },
    ],
  },
];

function HelpSectionAccordion({
  section,
  searchQuery,
}: {
  section: HelpSection;
  searchQuery: string;
}) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    if (!searchQuery) return section.items;
    const q = searchQuery.toLowerCase();
    return section.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [section.items, searchQuery]);

  if (filteredItems.length === 0) return null;

  const toggleItem = (title: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <section.icon className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.badge && (
            <Badge variant="secondary" className="text-xs">
              {section.badge}
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? "topic" : "topics"}
          </span>
        </div>
        <div className="divide-y">
          {filteredItems.map((item) => (
            <Collapsible
              key={item.title}
              open={openItems.has(item.title) || (searchQuery.length > 0)}
              onOpenChange={() => toggleItem(item.title)}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-3.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors">
                <span>{item.title}</span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-200 ${
                    openItems.has(item.title) || searchQuery.length > 0
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">
                  {item.content}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery) return helpSections;
    const q = searchQuery.toLowerCase();
    return helpSections.filter((section) => {
      if (section.title.toLowerCase().includes(q)) return true;
      return section.items.some(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Help</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-4 flex items-center gap-3">
            <BookOpen className="size-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Help &amp; Documentation</h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about managing your Gumite store.
              </p>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
        {filteredSections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="size-10 text-muted-foreground/50 mb-4" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term or browse all sections below.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => (
            <HelpSectionAccordion
              key={section.id}
              section={section}
              searchQuery={searchQuery}
            />
          ))
        )}

        <Separator className="my-8" />

        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>
            Can&apos;t find what you&apos;re looking for? Use the{" "}
            <strong>Report Issue</strong> button in the bottom-left corner to send us a question.
          </p>
        </div>
      </div>
    </div>
  );
}
