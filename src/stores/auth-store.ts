import { create } from "zustand";
import { AUTH_CONFIG, InternalUserInfo } from "@/lib/auth";

interface AuthState {
  user: InternalUserInfo | null;
  isAuthenticated: boolean;
  // Actions
  setUser: (user: InternalUserInfo | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  clearUser: () =>
    set({ user: null, isAuthenticated: false }),
}));

// ─── API functions (used by TanStack Query) ─────────────────

const API = AUTH_CONFIG.apiUrl;
const fetchOpts: RequestInit = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

/** Call /refresh to get a new access token cookie */
export async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API}${AUTH_CONFIG.endpoints.refresh}`, {
      ...fetchOpts,
      method: "POST",
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetch current user — auto-retries with refresh on 401 */
export async function fetchCurrentUser(): Promise<InternalUserInfo | null> {
  let res = await fetch(`${API}${AUTH_CONFIG.endpoints.me}`, {
    ...fetchOpts,
    method: "GET",
  });

  // Access token expired → try refresh, then retry
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      res = await fetch(`${API}${AUTH_CONFIG.endpoints.me}`, {
        ...fetchOpts,
        method: "GET",
      });
    }
  }

  if (!res.ok) return null;
  return res.json();
}

/** Login with email/password */
export async function loginApi(
  email: string,
  password: string,
  rememberMe?: boolean,
): Promise<{ user: InternalUserInfo }> {
  const res = await fetch(`${API}${AUTH_CONFIG.endpoints.login}`, {
    ...fetchOpts,
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message || "Invalid credentials");
  }

  return res.json();
}

/** Logout — clear server cookies */
export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API}${AUTH_CONFIG.endpoints.logout}`, {
      ...fetchOpts,
      method: "POST",
    });
  } catch {
    // Best-effort — always clear local state even if this fails
  }
  useAuthStore.getState().clearUser();
}
