"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Store } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api";

type PasswordTokenVariant = "invite" | "reset";

type PasswordTokenContent = {
  leftTitleTop: string;
  leftTitleAccent: string;
  leftDescription: string;
  headerTitle: string;
  headerDescription: string;
  missingTokenMessage: string;
  missingTokenActionLabel: string;
  missingTokenActionHref: string;
  invalidTokenMessage: string;
  expiredTokenMessage: string;
  fallbackErrorMessage: string;
  successTitle: string;
  successMessage: string;
  successHeroTitleTop: string;
  successHeroTitleAccent: string;
  submitLabel: string;
};

const CONTENT: Record<PasswordTokenVariant, PasswordTokenContent> = {
  invite: {
    leftTitleTop: "Set your",
    leftTitleAccent: "password",
    leftDescription:
      "You've been invited to the Gumite admin dashboard. Choose a secure password to activate your account.",
    headerTitle: "Set your password",
    headerDescription: "Choose a secure password for your new admin account.",
    missingTokenMessage: "Missing invitation token. Please use the link from your invitation email.",
    missingTokenActionLabel: "Go to login",
    missingTokenActionHref: "/login",
    invalidTokenMessage: "Invalid or expired invitation link. Please ask an admin to resend your invitation.",
    expiredTokenMessage: "This invitation link has expired. Please ask an admin to resend your invitation.",
    fallbackErrorMessage: "Failed to set password",
    successTitle: "Password set successfully",
    successMessage: "Your account is now active. You can sign in with your email and new password.",
    successHeroTitleTop: "You're all",
    successHeroTitleAccent: "set",
    submitLabel: "Set password",
  },
  reset: {
    leftTitleTop: "Reset your",
    leftTitleAccent: "password",
    leftDescription:
      "Choose a new password for your existing Gumite admin account and get back into the dashboard.",
    headerTitle: "Reset your password",
    headerDescription: "Create a new password for your existing admin account.",
    missingTokenMessage: "Missing reset token. Please use the link from your password reset email.",
    missingTokenActionLabel: "Request a new reset link",
    missingTokenActionHref: "/forgot-password",
    invalidTokenMessage: "Invalid or expired reset link. Request a new password reset email.",
    expiredTokenMessage: "This reset link has expired. Request a new password reset email.",
    fallbackErrorMessage: "Failed to reset password",
    successTitle: "Password reset successfully",
    successMessage: "Your password has been updated. Sign in with your email and new password.",
    successHeroTitleTop: "Password",
    successHeroTitleAccent: "updated",
    submitLabel: "Reset password",
  },
};

export function PasswordTokenPage({ variant }: { variant: PasswordTokenVariant }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <PasswordTokenPageInner variant={variant} />
    </Suspense>
  );
}

function decodeTokenEmail(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return payload.sub || payload.email || null;
  } catch {
    return null;
  }
}

function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

function PasswordTokenPageInner({ variant }: { variant: PasswordTokenVariant }) {
  const content = CONTENT[variant];
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setEmail(decodeTokenEmail(token));
    }
  }, [token]);

  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(content.missingTokenMessage);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : content.fallbackErrorMessage;
      if (message.includes("TOKEN_EXPIRED") || message.toLowerCase().includes("expired")) {
        setError(content.expiredTokenMessage);
      } else if (message.includes("INVALID_TOKEN")) {
        setError(content.invalidTokenMessage);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthPageShell
        heroTitleTop={content.leftTitleTop}
        heroTitleAccent={content.leftTitleAccent}
        heroDescription={content.leftDescription}
      >
        <div className="w-full max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{content.missingTokenMessage}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(content.missingTokenActionHref)}
          >
            {content.missingTokenActionLabel}
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  if (success) {
    return (
      <AuthPageShell
        heroTitleTop={content.successHeroTitleTop}
        heroTitleAccent={content.successHeroTitleAccent}
        heroDescription={content.successMessage}
      >
        <div className="w-full max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 space-y-8">
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold">Gumite</span>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{content.successTitle}</h2>
            <p className="text-zinc-500">{content.successMessage}</p>
          </div>

          <Button className="w-full h-11 font-medium" onClick={() => router.push("/login")}>
            Sign in to Gumite
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      heroTitleTop={content.leftTitleTop}
      heroTitleAccent={content.leftTitleAccent}
      heroDescription={content.leftDescription}
    >
      <div className="w-full max-w-[430px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 space-y-8">
        <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-700">
            <Store className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-zinc-900 dark:text-white">Gumite</span>
        </div>

        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {content.headerTitle}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {email ? (
              <>
                {content.headerDescription}{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>
              </>
            ) : (
              content.headerDescription
            )}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="new-password"
                  autoFocus
                  className="h-11 pr-10 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full transition-all ${strength.color}`}
                      style={{ width: `${Math.max(strength.score, 1) * 20}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Password strength: <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                className="h-11 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {variant === "invite" ? "Setting password..." : "Resetting password..."}
              </>
            ) : (
              content.submitLabel
            )}
          </Button>
        </form>
      </div>
    </AuthPageShell>
  );
}

function AuthPageShell({
  heroTitleTop,
  heroTitleAccent,
  heroDescription,
  children,
}: {
  heroTitleTop: string;
  heroTitleAccent: string;
  heroDescription: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-0 left-0 h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">Gumite</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {heroTitleTop}
              <br />
              <span className="text-zinc-300">{heroTitleAccent}</span>
            </h1>
            <p className="text-zinc-300/90 text-lg max-w-md">{heroDescription}</p>
            <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
              <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Encrypted storage
              </div>
              <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role-based access
              </div>
            </div>
          </div>
          <div className="text-sm text-zinc-500">Gumite Commerce Platform</div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        {children}
      </div>
    </div>
  );
}
