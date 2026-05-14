"use client";

import React from "react";
import { calculateVariantCount, getVariantCountStatus } from "@/lib/option-templates";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VariantPreviewCalculatorProps {
  options: Array<{
    title: string;
    values: string[];
  }>;
  showBreakdown?: boolean;
  className?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function VariantPreviewCalculator({
  options,
  showBreakdown = true,
  className = "",
}: VariantPreviewCalculatorProps) {
  // Filter out options with no values
  const validOptions = options.filter((opt) => opt.values.length > 0);
  const variantCount = calculateVariantCount(validOptions);
  const status = getVariantCountStatus(variantCount);

  // Generate all possible combinations for breakdown
  const generateCombinations = () => {
    if (validOptions.length === 0) return [];
    if (validOptions.length === 1) {
      return validOptions[0].values.map((val) => [val]);
    }

    const combinations: string[][] = [];
    const generate = (current: string[], index: number) => {
      if (index === validOptions.length) {
        combinations.push([...current]);
        return;
      }

      for (const value of validOptions[index].values) {
        current.push(value);
        generate(current, index + 1);
        current.pop();
      }
    };

    generate([], 0);
    return combinations;
  };

  const combinations = showBreakdown ? generateCombinations() : [];

  // Color mapping for status
  const statusColors = {
    safe: "text-green-700 bg-green-50 border-green-200",
    warning: "text-yellow-700 bg-yellow-50 border-yellow-200",
    danger: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ━━━ Main Calculation Display ━━━ */}
      <div
        className={`rounded-lg border p-3 ${statusColors[status.status]}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5">
            {status.status === "safe" && (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {status.status === "warning" && (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {status.status === "danger" && (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            {/* Calculation Formula */}
            {validOptions.length > 0 && (
              <div className="font-mono text-sm font-medium">
                {validOptions.map((opt, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="mx-1">×</span>}
                    <span>
                      {opt.values.length} {opt.title.toLowerCase()}
                      {opt.values.length !== 1 ? "s" : ""}
                    </span>
                  </React.Fragment>
                ))}
                <span className="mx-1">=</span>
                <span className="font-bold">{variantCount} variants</span>
              </div>
            )}

            {/* Status Message */}
            <p className="text-xs">{status.message}</p>

            {/* Shopify Limit Warning */}
            {variantCount >= 80 && (
              <p className="text-xs font-medium">
                Shopify&apos;s limit is 100 variants per product.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ━━━ Breakdown Table ━━━ */}
      {showBreakdown && combinations.length > 0 && combinations.length <= 20 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Variants That Will Be Created ({combinations.length})
          </h4>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {combinations.map((combo, i) => (
              <div
                key={i}
                className="rounded bg-background px-2 py-1.5 text-xs font-mono"
              >
                {combo.join(" / ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ Too Many Variants Warning ━━━ */}
      {showBreakdown && combinations.length > 20 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">{combinations.length} variants</span> will be created.
            Preview hidden to avoid performance issues. Consider reducing options
            if this is more than needed.
          </p>
        </div>
      )}

      {/* ━━━ No Options State ━━━ */}
      {validOptions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Add options to see variant preview
          </p>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Compact Version (for inline display)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CompactVariantCounterProps {
  options: Array<{
    values: string[];
  }>;
}

export function CompactVariantCounter({ options }: CompactVariantCounterProps) {
  const validOptions = options.filter((opt) => opt.values.length > 0);
  const count = calculateVariantCount(validOptions);
  const status = getVariantCountStatus(count);

  const textColors = {
    safe: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <span className={`text-xs font-medium ${textColors[status.status]}`}>
      {count} variant{count !== 1 ? "s" : ""}
    </span>
  );
}
