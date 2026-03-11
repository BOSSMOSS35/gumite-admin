"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AUTH_CONFIG,
  InternalUserInfo,
  LoginRequest,
  AuthResponse,
  AuthError,
} from "./auth";

type AuthState = {
  user: InternalUserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextType = AuthState & {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

// Refresh access token every 20 hours (cookie maxAge is 24h)
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  // Track if we just authenticated via login (to prevent re-fetch on navigation)
  const justAuthenticatedRef = useRef(false);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Try to refresh the access token using the refresh cookie
  const tryRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.refresh}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Fetch current user (with automatic refresh on 401)
  const fetchUser = useCallback(async (): Promise<InternalUserInfo | null> => {
    try {
      let response = await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If access token expired, try refreshing it
      if (response.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          // Retry the /me call with the new access token cookie
          response = await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.me}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }, [tryRefresh]);

  // Login
  const login = useCallback(
    async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(
          `${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.login}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          }
        );

        if (!response.ok) {
          const errorData: AuthError = await response.json();
          return { success: false, error: errorData.message };
        }

        const data: AuthResponse = await response.json();

        // Mark as just authenticated to prevent re-fetch on navigation
        justAuthenticatedRef.current = true;

        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "An unexpected error occurred" };
      }
    },
    []
  );

  // Force logout: clear cookies on server + redirect to login
  const forceLogout = useCallback(async () => {
    try {
      await fetch(`${AUTH_CONFIG.apiUrl}${AUTH_CONFIG.endpoints.logout}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Even if the API call fails, still clear local state
    }
    justAuthenticatedRef.current = false;
    setState({ user: null, isLoading: false, isAuthenticated: false });
    router.push("/login");
  }, [router]);

  // Logout — delegates to forceLogout for cookie cleanup
  const logout = useCallback(async () => {
    await forceLogout();
  }, [forceLogout]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    const user = await fetchUser();
    setState({
      user,
      isLoading: false,
      isAuthenticated: !!user,
    });
  }, [fetchUser]);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth check on public routes during initial load
      if (isPublicRoute) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // If we just authenticated via login, skip the re-fetch
      if (justAuthenticatedRef.current) {
        justAuthenticatedRef.current = false;
        return;
      }

      const user = await fetchUser();

      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });

      // Redirect to login if not authenticated and not on public route
      if (!user && !isPublicRoute) {
        router.push("/login");
      }
    };

    initAuth();
  }, [fetchUser, isPublicRoute, router]);

  // Periodic silent token refresh — if refresh fails, fully log out
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(async () => {
      const refreshed = await tryRefresh();
      if (!refreshed) {
        forceLogout();
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, tryRefresh, forceLogout]);

  // Refresh token when tab regains focus — if session expired, fully log out
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && state.isAuthenticated) {
        const user = await fetchUser();
        if (!user) {
          forceLogout();
        } else {
          setState({ user, isLoading: false, isAuthenticated: true });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.isAuthenticated, fetchUser, forceLogout]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (state.isAuthenticated && isPublicRoute && pathname === "/login") {
      router.push("/");
    }
  }, [state.isAuthenticated, isPublicRoute, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
