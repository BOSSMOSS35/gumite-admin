"use client";

import React, { useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type HelpContext = "overview" | "templates" | "custom" | "preview" | "variants";

interface ContextualHelpSidebarProps {
  context?: HelpContext;
  className?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Help Content Data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const HELP_CONTENT = {
  overview: {
    title: "How Options Work",
    sections: [
      {
        heading: "What are Options?",
        content:
          "Options are categories like 'Size' or 'Color'. Each option contains multiple values (e.g., S, M, L, XL).",
        icon: "📦",
      },
      {
        heading: "What are Variants?",
        content:
          "Variants are specific combinations of option values that customers can buy. Example: 'Red / Size M' is one variant.",
        icon: "🏷️",
      },
      {
        heading: "The Relationship",
        content:
          "Options define what varies about your product. Variants are automatically created from all possible combinations. 3 sizes × 2 colors = 6 variants.",
        icon: "🔗",
      },
    ],
  },
  templates: {
    title: "Using Templates",
    sections: [
      {
        heading: "Why Use Templates?",
        content:
          "Templates provide pre-configured options based on industry best practices. They help avoid common mistakes and save time.",
        icon: "⚡",
      },
      {
        heading: "Combined vs Separate Sizes",
        content:
          "Combined (S / EU 54) is recommended - it prevents creating too many variants. Separate options multiply: 4 letter sizes × 4 EU sizes = 16 variants instead of 4.",
        icon: "⚠️",
      },
      {
        heading: "You Can Customize",
        content:
          "After applying a template, you can edit the values. Remove sizes you don't stock or add new colors.",
        icon: "✏️",
      },
    ],
  },
  custom: {
    title: "Creating Custom Options",
    sections: [
      {
        heading: "Option Name",
        content:
          "Use the category name (singular): 'Size', 'Color', 'Material' - not 'Sizes' or 'Colors'.",
        icon: "📝",
      },
      {
        heading: "Option Values",
        content:
          "Enter ALL values for this option, separated by commas. Example for sizes: 'S, M, L, XL' (not just 'S').",
        icon: "📋",
      },
      {
        heading: "Common Mistake",
        content:
          "Don't create separate options for each size! Instead of options '54', '56', '58', create ONE option 'Size' with values '54, 56, 58'.",
        icon: "🚫",
      },
    ],
  },
  preview: {
    title: "Variant Preview",
    sections: [
      {
        heading: "Live Calculation",
        content:
          "The preview shows exactly how many variants will be created. It multiplies all option value counts together.",
        icon: "🧮",
      },
      {
        heading: "Shopify Limits",
        content:
          "Maximum 100 variants per product. Green = safe (<50), Yellow = approaching limit (50-80), Red = too many (80+).",
        icon: "📊",
      },
      {
        heading: "Too Many Variants?",
        content:
          "If you see red warnings: (1) Use combined sizing instead of separate, (2) Remove colors/sizes you don't stock, (3) Create multiple products instead.",
        icon: "💡",
      },
    ],
  },
  variants: {
    title: "Managing Variants",
    sections: [
      {
        heading: "Auto-Generated",
        content:
          "When you add options, variants are created automatically for all combinations. You don't create them manually.",
        icon: "🤖",
      },
      {
        heading: "Setting Prices & Stock",
        content:
          "Each variant can have its own price, SKU, and inventory quantity. Edit them individually in the variants table.",
        icon: "💰",
      },
      {
        heading: "Deleting Variants",
        content:
          "To remove variants, delete the option values that create them. Deleting 'XL' from Size option removes all XL variants.",
        icon: "🗑️",
      },
    ],
  },
};

const COMMON_PATTERNS = [
  {
    title: "T-Shirt (Size + Color)",
    options: "Size: S, M, L, XL\nColor: Black, White, Navy",
    variants: "12 variants (4 × 3)",
    icon: "👕",
  },
  {
    title: "Shoes (Size only)",
    options: "Size: US 7 / EU 40, US 8 / EU 41, US 9 / EU 42",
    variants: "3 variants",
    icon: "👟",
  },
  {
    title: "Jewelry (Material)",
    options: "Material: Gold, Silver, Rose Gold",
    variants: "3 variants",
    icon: "💍",
  },
  {
    title: "Jacket (Size + Color + Material)",
    options: "Size: S, M, L\nColor: Black, Navy\nMaterial: Cotton, Wool",
    variants: "12 variants (3 × 2 × 2)",
    icon: "🧥",
  },
];

const TIPS_AND_TRICKS = [
  {
    title: "Start Simple",
    content: "Begin with 1-2 options. You can always add more later.",
    icon: "🎯",
  },
  {
    title: "Use Combined Sizing",
    content:
      "Combine EU and letter sizes in one option (S / EU 54) to avoid explosion of variants.",
    icon: "📏",
  },
  {
    title: "Stock What You Sell",
    content:
      "Only create variants for combinations you actually stock. Don't create 'Red / XL' if you never have red in XL.",
    icon: "📦",
  },
  {
    title: "Consistent Naming",
    content:
      "Use the same option names across products (e.g., always 'Size', not sometimes 'Sizing' or 'Sizes').",
    icon: "🏷️",
  },
  {
    title: "Max 3 Options",
    content:
      "Shopify allows max 3 options per product. Plan accordingly if you need more dimensions.",
    icon: "3️⃣",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ContextualHelpSidebar({
  context = "overview",
  className = "",
}: ContextualHelpSidebarProps) {
  const [activeSection, setActiveSection] = useState<
    "guide" | "patterns" | "tips"
  >("guide");

  const content = HELP_CONTENT[context];

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background ${className}`}
    >
      {/* ━━━ Header ━━━ */}
      <div className="border-b border-border bg-muted/30 p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Help & Guidance
        </h3>
      </div>

      {/* ━━━ Tab Navigation ━━━ */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSection("guide")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === "guide"
              ? "border-b-2 border-primary bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          Guide
        </button>
        <button
          onClick={() => setActiveSection("patterns")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === "patterns"
              ? "border-b-2 border-primary bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          Patterns
        </button>
        <button
          onClick={() => setActiveSection("tips")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === "tips"
              ? "border-b-2 border-primary bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          Tips
        </button>
      </div>

      {/* ━━━ Content ━━━ */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Guide Tab */}
        {activeSection === "guide" && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">{content.title}</h4>
            {content.sections.map((section, i) => (
              <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  <h5 className="text-xs font-semibold">{section.heading}</h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Common Patterns Tab */}
        {activeSection === "patterns" && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Common Patterns</h4>
            <p className="text-xs text-muted-foreground">
              Real-world examples of how to structure options
            </p>
            {COMMON_PATTERNS.map((pattern, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{pattern.icon}</span>
                  <h5 className="text-xs font-semibold">{pattern.title}</h5>
                </div>
                <div className="mb-2 rounded bg-muted/50 p-2">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {pattern.options}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  → {pattern.variants}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tips Tab */}
        {activeSection === "tips" && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Tips & Best Practices</h4>
            {TIPS_AND_TRICKS.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 text-xl">{tip.icon}</div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-semibold">{tip.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ━━━ Footer (Quick Links) ━━━ */}
      <div className="border-t border-border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Need more help?
        </p>
        <div className="space-y-1">
          <a
            href="https://help.shopify.com/manual/products/variants"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Shopify Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Compact Version (Collapsible)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CompactHelpProps {
  context?: HelpContext;
}

export function CompactHelp({ context = "overview" }: CompactHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = HELP_CONTENT[context];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-blue-50 px-3 py-2 text-xs text-blue-900 hover:bg-blue-100"
      >
        <svg
          className="h-4 w-4 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium">Need help?</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-blue-900">
          {content.title}
        </h5>
        <button
          onClick={() => setIsOpen(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        {content.sections.map((section, i) => (
          <div key={i} className="text-xs text-blue-800">
            <p className="font-medium">
              {section.icon} {section.heading}
            </p>
            <p className="mt-0.5 text-blue-700">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
