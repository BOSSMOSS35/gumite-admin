"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bug, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";

interface IssueFormData {
  type: "bug" | "feature" | "question";
  page: string;
  description: string;
  stepsToReproduce: string;
  priority: "low" | "medium" | "high";
  screenshot: File | null;
  browserInfo: string;
  timestamp: string;
}

interface StoredIssue extends Omit<IssueFormData, "screenshot"> {
  id: string;
  screenshotName?: string;
  submittedAt: string;
  synced: boolean;
}

const STORAGE_KEY = "gumite-reported-issues";

function getBrowserInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let version = "";

  if (ua.includes("Firefox/")) {
    browser = "Firefox";
    version = ua.split("Firefox/")[1]?.split(" ")[0] ?? "";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
    version = ua.split("Edg/")[1]?.split(" ")[0] ?? "";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
    version = ua.split("Chrome/")[1]?.split(" ")[0] ?? "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    version = ua.split("Version/")[1]?.split(" ")[0] ?? "";
  }

  return `${browser} ${version}`.trim();
}

function saveIssueToStorage(issue: StoredIssue) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.push(issue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

export function IssueReporter() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<IssueFormData>({
    type: "bug",
    page: "",
    description: "",
    stepsToReproduce: "",
    priority: "medium",
    screenshot: null,
    browserInfo: "",
    timestamp: "",
  });

  // Pre-fill context when dialog opens
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        page: pathname || window.location.pathname,
        browserInfo: getBrowserInfo(),
        timestamp: new Date().toISOString(),
      }));
    }
  }, [open, pathname]);

  const resetForm = useCallback(() => {
    setFormData({
      type: "bug",
      page: "",
      description: "",
      stepsToReproduce: "",
      priority: "medium",
      screenshot: null,
      browserInfo: "",
      timestamp: "",
    });
  }, []);

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error("Please enter a description.");
      return;
    }

    setIsSubmitting(true);

    const storedIssue: StoredIssue = {
      id: crypto.randomUUID(),
      type: formData.type,
      page: formData.page,
      description: formData.description,
      stepsToReproduce: formData.stepsToReproduce,
      priority: formData.priority,
      browserInfo: formData.browserInfo,
      timestamp: formData.timestamp,
      screenshotName: formData.screenshot?.name,
      submittedAt: new Date().toISOString(),
      synced: false,
    };

    try {
      // Attempt to send to backend
      const payload = new FormData();
      payload.append("type", formData.type);
      payload.append("page", formData.page);
      payload.append("description", formData.description);
      payload.append("stepsToReproduce", formData.stepsToReproduce);
      payload.append("priority", formData.priority);
      payload.append("browserInfo", formData.browserInfo);
      payload.append("timestamp", formData.timestamp);
      if (formData.screenshot) {
        payload.append("screenshot", formData.screenshot);
      }

      await apiFetch("/admin/issues", {
        method: "POST",
        headers: {}, // Let browser set content-type for FormData
        body: payload as unknown as BodyInit,
      });

      storedIssue.synced = true;
      saveIssueToStorage(storedIssue);
      toast.success("Issue reported. We'll look into it.");
    } catch {
      // Backend unavailable — store locally
      saveIssueToStorage(storedIssue);
      toast.success("Issue saved locally. We'll look into it when the connection is restored.");
    } finally {
      setIsSubmitting(false);
      setOpen(false);
      resetForm();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Screenshot must be under 10MB.");
      return;
    }
    setFormData((prev) => ({ ...prev, screenshot: file }));
  };

  // Pre-fill error info from global error boundary
  const prefillError = useCallback((errorMessage: string) => {
    setFormData((prev) => ({
      ...prev,
      type: "bug" as const,
      description: `Error: ${errorMessage}`,
      priority: "high" as const,
    }));
    setOpen(true);
  }, []);

  // Expose prefill method on window for error boundary integration
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__reportIssue = prefillError;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__reportIssue;
    };
  }, [prefillError]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="fixed bottom-4 left-4 z-40 h-10 w-10 rounded-full shadow-lg border-muted-foreground/20 bg-background hover:bg-muted"
              aria-label="Report an issue"
            >
              <Bug className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Report an Issue</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you encountered. Your browser info and current page are captured automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue-type">Issue Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "bug" | "feature" | "question") =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger id="issue-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page */}
          <div className="space-y-2">
            <Label htmlFor="issue-page">Page</Label>
            <Input
              id="issue-page"
              value={formData.page}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, page: e.target.value }))
              }
              readOnly
              className="text-muted-foreground bg-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="issue-description"
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="issue-steps">Steps to Reproduce (optional)</Label>
            <Textarea
              id="issue-steps"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              value={formData.stepsToReproduce}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  stepsToReproduce: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="issue-priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: "low" | "medium" | "high") =>
                setFormData((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger id="issue-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label>Screenshot (optional)</Label>
            {formData.screenshot ? (
              <div className="flex items-center gap-2 rounded-md border p-3">
                <Upload className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">
                  {formData.screenshot.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, screenshot: null }))
                  }
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  <Upload className="size-4" />
                  Click to upload a screenshot
                </div>
              </div>
            )}
          </div>

          {/* Auto-detected info */}
          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Browser: {formData.browserInfo || "Detecting..."}</span>
            <span>
              Time: {formData.timestamp ? new Date(formData.timestamp).toLocaleString() : "..."}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Issue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
