"use client";

import { useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAuthStore,
  fetchCurrentUser,
  loginApi,
  logoutApi,
} from "@/stores/auth-store";
import type { LoginRequest, InternalUserInfo } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/set-password"];

// Refetch session every 20 hours (cookie maxAge = 24h, JWT = 24h)
const REFETCH_INTERVAL = 20 * 60 * 60 * 1000;

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname?.startsWith(r));

  // ─── Session query: fetches /me with auto-refresh on 401 ───
  const { isLoading, data, isError } = useQuery<InternalUserInfo | null>({
    queryKey: ["auth", "session"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes before considered stale
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true, // Re-validate when user returns to tab
    refetchOnReconnect: true,
    enabled: !isPublicRoute, // Don't fetch on login page
  });

  // Sync TanStack data → Zustand store
  useEffect(() => {
    if (data !== undefined) {
      if (data) {
        setUser(data);
      } else {
        clearUser();
      }
    }
  }, [data, setUser, clearUser]);

  // If query errored or returned null on a protected route → redirect to login
  useEffect(() => {
    if (isLoading || isPublicRoute) return;
    if (isError || (data === null && !isAuthenticated)) {
      logoutApi().then(() => router.push("/login"));
    } else if (data && !isAdminUser(data)) {
      logoutApi().then(() => router.push("/login"));
    }
  }, [isLoading, isPublicRoute, isError, data, isAuthenticated, router]);

  // Redirect authenticated users away from login
  useEffect(() => {
    if (isAuthenticated && pathname === "/login") {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router]);

  // ─── Login mutation ────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (creds: LoginRequest) =>
      loginApi(creds.email, creds.password, creds.rememberMe),
    onSuccess: (response) => {
      setUser(response.user);
      // Seed the session cache so useQuery doesn't re-fetch immediately
      queryClient.setQueryData(["auth", "session"], response.user);
    },
  });

  const login = useCallback(
    async (
      credentials: LoginRequest,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await loginMutation.mutateAsync(credentials);
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        return { success: false, error: message };
      }
    },
    [loginMutation],
  );

  // ─── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutApi();
    queryClient.removeQueries({ queryKey: ["auth"] });
    router.push("/login");
  }, [queryClient, router]);

  // ─── Refresh user (force re-fetch) ────────────────────────
  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };
}
