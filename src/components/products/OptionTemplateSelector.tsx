"use client";

import React, { useState } from "react";
import {
  OPTION_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type OptionTemplate,
  calculateVariantCount,
} from "@/lib/option-templates";
import { CompactVariantCounter } from "./VariantPreviewCalculator";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface OptionTemplateSelectorProps {
  onSelect: (template: OptionTemplate) => void;
  onCustom: () => void;
  className?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function OptionTemplateSelector({
  onSelect,
  onCustom,
  className = "",
}: OptionTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "clothing" | "shoes" | "colors" | "materials" | "custom"
  >("clothing");

  const filteredTemplates = OPTION_TEMPLATES.filter(
    (t) => t.category === selectedCategory
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ━━━ Category Tabs ━━━ */}
      <div className="flex gap-2 border-b border-border pb-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* ━━━ Templates Grid ━━━ */}
      {selectedCategory !== "custom" ? (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelect(template)}
            />
          ))}

          {/* Custom Option at Bottom */}
          <button
            onClick={onCustom}
            className="w-full rounded-lg border border-dashed border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">✏️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Start From Scratch</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create custom options without using a template
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <div className="text-4xl mb-3">✏️</div>
          <h3 className="font-semibold mb-2">Custom Options</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Define your own option categories and values from scratch
          </p>
          <button
            onClick={onCustom}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Custom Options
          </button>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Template Card Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TemplateCardProps {
  template: OptionTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const variantCount = calculateVariantCount(template.options);

  return (
    <div className="rounded-lg border border-border bg-background transition-shadow hover:shadow-md">
      {/* ━━━ Header (Always Visible) ━━━ */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-2xl">{template.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {template.description}
                </p>
              </div>

              {/* Variant Count Badge */}
              <div className="shrink-0">
                <CompactVariantCounter options={template.options} />
              </div>
            </div>

            {/* Quick Info */}
            <div className="mt-2 flex flex-wrap gap-2">
              {template.options.map((opt, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  <span className="font-medium">{opt.title}:</span>
                  <span className="text-muted-foreground">
                    {opt.values.length} value{opt.values.length !== 1 ? "s" : ""}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Expand Icon */}
          <div className="shrink-0 text-muted-foreground">
            <svg
              className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* ━━━ Expanded Details ━━━ */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Options Preview */}
          <div className="space-y-2">
            {template.options.map((option, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {option.title}
                  </span>
                  {option.recommended && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {option.values.map((val, j) => (
                    <span
                      key={j}
                      className="rounded bg-background px-2 py-1 text-xs font-mono"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            <div className="flex gap-2">
              <div className="shrink-0 text-blue-600">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p>{template.helpText}</p>
            </div>
          </div>

          {/* Example Products */}
          {template.exampleProducts.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Great for:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.exampleProducts.map((product, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={onSelect}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Use This Template
          </button>
        </div>
      )}
    </div>
  );
}
