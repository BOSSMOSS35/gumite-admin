import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full animate-in fade-in duration-500">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Toolbar / Filters Skeleton */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/4 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full max-w-xs" />
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
