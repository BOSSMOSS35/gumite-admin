"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  Something went wrong
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  A critical error occurred. Please try refreshing the page. If the problem
                  persists, contact your system administrator.
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    Reference: {error.digest}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
