"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/utils";
import { getProducts, type ProductSummary } from "@/lib/api";
import { Search, Package, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";


export function CommandPalette() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  // Search products when query changes
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getProducts({ q: query.trim(), start: 0, end: 10 });
        setResults(res.content);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      if (e.key === "Escape") {
        setQuery("");
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToProduct(results[selectedIndex].id);
        } else if (results.length === 1) {
          navigateToProduct(results[0].id);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
        break;
    }
  }

  function navigateToProduct(id: string) {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    router.push(`/products/${id}`);
  }

  // Global Cmd+K shortcut to focus search
  React.useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Inline search input */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-9 w-64 rounded-md border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all focus:w-80"
        />
        {isLoading && (
          <Loader2 className="absolute right-8 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-96 max-h-[420px] overflow-auto rounded-md border bg-popover shadow-lg z-50">
          {results.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Search className="h-8 w-8 opacity-40" />
              <p className="text-sm">No products found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {results.length} product{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((product, index) => {
                const thumb = getImageUrl(product.thumbnail);
                return (
                  <button
                    key={product.id}
                    onClick={() => navigateToProduct(product.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    {/* Product thumbnail */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.title}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <Package className={`h-5 w-5 text-muted-foreground ${thumb ? "hidden" : ""}`} />
                    </div>

                    {/* Product info */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="truncate font-medium">{product.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {product.brandName && `${product.brandName} · `}
                        {product.handle}
                      </span>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={product.status} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t px-3 py-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <kbd className="rounded border bg-muted px-1">↑↓</kbd> navigate
              <kbd className="rounded border bg-muted px-1">↵</kbd> open
              <kbd className="rounded border bg-muted px-1">esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300 text-[10px] px-1.5 py-0">Published</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-zinc-500/10 dark:text-zinc-300 text-[10px] px-1.5 py-0">Draft</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{status}</Badge>;
  }
}
