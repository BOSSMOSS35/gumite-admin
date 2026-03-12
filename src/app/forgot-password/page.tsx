"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { resetPassword } from "@/lib/api";

export default function ForgotPasswordPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <ForgotPasswordPage />
    </Suspense>
  );
}

function decodeTokenEmail(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.email || null;
  } catch {
    return null;
  }
}

function checkPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

function ForgotPasswordPage() {
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

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
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
    } catch (err: any) {
      const msg = err?.message || "Failed to set password";
      if (msg.includes("TOKEN_EXPIRED") || msg.includes("expired")) {
        setError(
          "This link has expired. Please ask an admin to resend your invitation."
        );
      } else if (msg.includes("INVALID_TOKEN")) {
        setError(
          "Invalid or expired link. Please ask an admin to resend your invitation."
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-neutral-900 relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between w-full p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Gumite</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Set your
                <br />
                <span className="text-zinc-300">password</span>
              </h1>
            </div>
            <div className="text-sm text-zinc-500">
              Gumite Commerce Platform
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="w-full max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Missing reset token. Please use the link from your invitation
                email.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Go to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-neutral-900 relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between w-full p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Gumite</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-white leading-tight">
                You&apos;re all
                <br />
                <span className="text-zinc-300">set</span>
              </h1>
              <p className="text-zinc-300/90 text-lg max-w-md">
                Your account is ready. Sign in to start managing your store.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              Gumite Commerce Platform
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
              <h2 className="text-2xl font-semibold tracking-tight">
                Password set successfully
              </h2>
              <p className="text-zinc-500">
                Your account is now active. You can sign in with your email and
                new password.
              </p>
            </div>

            <Button
              className="w-full h-11 font-medium"
              onClick={() => router.push("/login")}
            >
              Sign in to Gumite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
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
              Set your
              <br />
              <span className="text-zinc-300">password</span>
            </h1>
            <p className="text-zinc-300/90 text-lg max-w-md">
              You&apos;ve been invited to the Gumite admin dashboard. Choose a
              secure password to get started.
            </p>
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

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-[430px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-700">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-zinc-900 dark:text-white">
              Gumite
            </span>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Set your password
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {email ? (
                <>
                  Choose a password for{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {email}
                  </span>
                </>
              ) : (
                "Choose a secure password for your account"
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-zinc-700 dark:text-zinc-300"
                >
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
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength.score
                              ? strength.color
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Password strength:{" "}
                      <span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-zinc-700 dark:text-zinc-300"
                >
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
                {confirmPassword.length > 0 &&
                  password !== confirmPassword && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={
                isSubmitting ||
                !password ||
                !confirmPassword ||
                password !== confirmPassword ||
                password.length < 8
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting password...
                </>
              ) : (
                "Set password & activate account"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-zinc-900 dark:text-white hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
