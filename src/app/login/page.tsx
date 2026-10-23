"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { TURNSTILE_SITE_KEY, Turnstile } from "@/components/auth/turnstile";
import { AuthFooter, authInputClass, authErrorMessage } from "@/components/auth/auth-ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      router.push("/");
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the check above the button.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error.message));
      setCaptchaReset((n) => n + 1);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <main className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-700 text-white shadow-sm">
            <LogIn size={20} aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sign in to your sales dashboard</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Running in demo mode &mdash; no Supabase project connected yet. Continue below to explore with
            sample data.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSupabaseConfigured && (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputClass}
                  placeholder="you@company.com"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInputClass}
                  placeholder="••••••••"
                />
              </label>
              <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-60"
          >
            {isSupabaseConfigured ? (loading ? "Signing in..." : "Sign in") : "Continue in demo mode"}
          </button>
        </form>

        {isSupabaseConfigured && (
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-orange-700 hover:underline dark:text-orange-400">
              Sign up
            </Link>
          </p>
        )}
        <AuthFooter />
      </main>
    </div>
  );
}
