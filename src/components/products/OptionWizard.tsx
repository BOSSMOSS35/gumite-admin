"use client";

import React, { useState } from "react";
import { OptionTemplateSelector } from "./OptionTemplateSelector";
import { VariantPreviewCalculator } from "./VariantPreviewCalculator";
import { CompactHelp } from "./ContextualHelpSidebar";
import { type OptionTemplate } from "@/lib/option-templates";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type WizardStep = "choose-template" | "configure-options" | "preview-variants";

interface OptionWizardProps {
  onComplete: (options: Array<{ title: string; values: string[] }>) => void;
  onCancel: () => void;
  existingOptions?: Array<{ title: string; values: string[] }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function OptionWizard({
  onComplete,
  onCancel,
  existingOptions = [],
}: OptionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("choose-template");
  const [selectedTemplate, setSelectedTemplate] = useState<OptionTemplate | null>(null);
  const [options, setOptions] = useState<Array<{ title: string; values: string[] }>>(
    existingOptions
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Store raw text input for values to avoid splitting on every keystroke
  const [valuesText, setValuesText] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    existingOptions.forEach((opt, index) => {
      initial[index] = opt.values.join(", ");
    });
    return initial;
  });

  // ━━━ Step 1: Choose Template ━━━
  const handleTemplateSelect = (template: OptionTemplate) => {
    setSelectedTemplate(template);
    const newOptions = template.options.map((opt) => ({
      title: opt.title,
      values: opt.values,
    }));
    setOptions(newOptions);
    // Initialize valuesText with template values
    const initialValuesText: Record<number, string> = {};
    newOptions.forEach((opt, index) => {
      initialValuesText[index] = opt.values.join(", ");
    });
    setValuesText(initialValuesText);
    setCurrentStep("configure-options");
  };

  const handleCustom = () => {
    setSelectedTemplate(null);
    setOptions([{ title: "", values: [] }]);
    setValuesText({ 0: "" });
    setCurrentStep("configure-options");
  };

  const handleSkipToAdvanced = () => {
    setShowAdvanced(true);
    onCancel(); // This will close the wizard and show the advanced form
  };

  // ━━━ Step 2: Configure Options ━━━
  const handleOptionChange = (index: number, field: "title" | "values", value: string) => {
    const newOptions = [...options];
    if (field === "title") {
      newOptions[index].title = value;
    } else {
      // Store the raw text input
      setValuesText({ ...valuesText, [index]: value });
      // Parse values from text
      newOptions[index].values = value.split(",").map((v) => v.trim()).filter(Boolean);
    }
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 3) {
      const newIndex = options.length;
      setOptions([...options, { title: "", values: [] }]);
      setValuesText({ ...valuesText, [newIndex]: "" });
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    // Clean up valuesText for removed index
    const newValuesText = { ...valuesText };
    delete newValuesText[index];
    setValuesText(newValuesText);
  };

  const canProceedToPreview = options.every(
    (opt) => opt.title.trim() !== "" && opt.values.length > 0
  );

  // ━━━ Step 3: Preview & Confirm ━━━
  const handleConfirm = () => {
    onComplete(options);
  };

  // ━━━ Progress Indicator ━━━
  const steps = [
    { id: "choose-template", label: "Choose Template" },
    { id: "configure-options", label: "Configure Options" },
    { id: "preview-variants", label: "Preview & Confirm" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex h-full max-h-[85vh] flex-col">
      {/* ━━━ Header with Progress ━━━ */}
      <div className="space-y-3 border-b border-border p-6 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Add Product Options</h3>
          <button
            onClick={handleSkipToAdvanced}
            className="text-xs text-primary hover:underline"
          >
            Skip to Advanced Mode
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    index < currentStepIndex
                      ? "bg-green-600 text-white"
                      : index === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    index <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    index < currentStepIndex ? "bg-green-600" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ━━━ Step Content ━━━ */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Choose Template */}
        {currentStep === "choose-template" && (
          <div className="space-y-3">
            <CompactHelp context="templates" />
            <OptionTemplateSelector
              onSelect={handleTemplateSelect}
              onCustom={handleCustom}
            />
          </div>
        )}

        {/* Step 2: Configure Options */}
        {currentStep === "configure-options" && (
          <div className="space-y-4">
            <CompactHelp context="custom" />

            {selectedTemplate && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-primary">
                  <span className="font-semibold">Template Applied:</span> {selectedTemplate.name}
                  <br />
                  You can edit the values below before proceeding.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold">
                      Option {index + 1}
                      {index === 0 && <span className="ml-1 text-xs text-muted-foreground">(Required)</span>}
                    </label>
                    {index > 0 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Option Name */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Option Name
                      </label>
                      <input
                        type="text"
                        value={option.title}
                        onChange={(e) => handleOptionChange(index, "title", e.target.value)}
                        placeholder="e.g., Size, Color, Material"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Option Values */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Values (comma-separated)
                      </label>
                      <textarea
                        value={valuesText[index] || ""}
                        onChange={(e) => handleOptionChange(index, "values", e.target.value)}
                        placeholder="e.g., UK 8.5 / EU 43, UK 9 / EU 43.5, UK 9.5 / EU 44, UK 10 / EU 44.5"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.values.length} value{option.values.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {options.length < 3 && (
              <button
                onClick={handleAddOption}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Another Option (Max 3)
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("choose-template")}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("preview-variants")}
                disabled={!canProceedToPreview}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {currentStep === "preview-variants" && (
          <div className="space-y-4">
            <CompactHelp context="preview" />

            {/* Options Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Your Options</h4>
              {options.map((option, index) => (
                <div key={index} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {option.title}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {option.values.map((val, i) => (
                      <span key={i} className="rounded bg-background px-2 py-1 text-xs font-mono">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Variant Preview */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Variants to be Created</h4>
              <VariantPreviewCalculator options={options} showBreakdown={true} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("configure-options")}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Create Options & Variants
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ Footer Actions ━━━ */}
      <div className="shrink-0 border-t border-border p-6 pt-3">
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
