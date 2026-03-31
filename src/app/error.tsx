"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring (no stack traces in UI)
    console.error("Application error:", error);
  }, [error]);

  const sanitizedMessage =
    error.message && !error.message.includes("at ") && error.message.length < 200
      ? error.message
      : "An unexpected error occurred while loading this page.";

  const handleReportIssue = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportFn = (window as any).__reportIssue;
    if (typeof reportFn === "function") {
      (reportFn as (msg: string) => void)(sanitizedMessage);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center pt-8 pb-8 px-8 space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sanitizedMessage}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="default" className="gap-2">
              <RefreshCw className="size-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">
                <Home className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={handleReportIssue}
          >
            <Bug className="size-4" />
            Report this issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
