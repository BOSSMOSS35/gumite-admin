// Auth configuration and utilities for internal admin users

export const AUTH_CONFIG = {
  apiUrl: "",
  endpoints: {
    login: "/api/v1/internal/auth/login",
    me: "/api/v1/internal/auth/me",
    logout: "/api/v1/internal/auth/logout",
    refresh: "/api/v1/internal/auth/refresh",
  },
  // Admin roles that can access the dashboard
  adminRoles: ["ADMIN"],
};

// Internal user info returned from auth endpoints
export type InternalUserInfo = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string; // ADMIN, CUSTOMER, GUEST
};

// Login request
export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

// Auth response (login/refresh)
export type AuthResponse = {
  user: InternalUserInfo;
};

// Auth error response
export type AuthError = {
  error: string;
  message: string;
};

export function isAdminUser(user: InternalUserInfo | null): boolean {
  if (!user) return false;
  return AUTH_CONFIG.adminRoles.includes(user.role);
}

export function getUserDisplayName(user: InternalUserInfo | null): string {
  if (!user) return "";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  return user.email.split("@")[0];
}

export function getUserInitials(user: InternalUserInfo | null): string {
  if (!user) return "?";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-destructive/10 text-destructive ";
    case "CUSTOMER":
      return "bg-info/10 text-info ";
    case "GUEST":
      return "bg-gray-100 text-gray-800 dark:bg-zinc-500/10 dark:text-zinc-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-zinc-500/10 dark:text-zinc-300";
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "CUSTOMER":
      return "Customer";
    case "GUEST":
      return "Guest";
    default:
      return role;
  }
}
