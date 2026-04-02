"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Store } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";

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

function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace(`/reset-password?token=${encodeURIComponent(token)}`);
    }
  }, [router, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (success) {
    return (
      <AuthShell
        titleTop="Check your"
        titleAccent="email"
        description="We've sent reset instructions to your inbox if an admin account exists for that address."
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
            <h2 className="text-2xl font-semibold tracking-tight">Reset link sent</h2>
            <p className="text-zinc-500">
              If an admin account exists for <span className="font-medium text-zinc-700">{email}</span>, we&apos;ve sent a password reset link.
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full h-11 font-medium" onClick={() => router.push("/login")}>
              Back to sign in
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
              Send another link
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titleTop="Forgot your"
      titleAccent="password?"
      description="Enter your admin email address and we'll send you a link to reset your password."
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
            Reset your password
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            We&apos;ll email you a secure link to choose a new password.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
              Admin email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gumite.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="email"
              autoFocus
              className="h-11 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-3">
            <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/login")}>
              Back to sign in
            </Button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}

function AuthShell({
  titleTop,
  titleAccent,
  description,
  children,
}: {
  titleTop: string;
  titleAccent: string;
  description: string;
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
              {titleTop}
              <br />
              <span className="text-zinc-300">{titleAccent}</span>
            </h1>
            <p className="text-zinc-300/90 text-lg max-w-md">{description}</p>
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
