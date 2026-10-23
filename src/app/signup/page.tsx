"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TURNSTILE_SITE_KEY, Turnstile } from "@/components/auth/turnstile";
import { AuthFooter, authErrorMessage, authInputClass } from "@/components/auth/auth-ui";

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Honeypot: hidden from people, filled in by most form-spamming bots.
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (website) {
      // Looks like a bot: act as if it worked, create nothing.
      setDone(true);
      return;
    }
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use at least one letter and one number in your password.");
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) return setError("Please complete the check above the button.");

    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error.message));
      setCaptchaReset((n) => n + 1);
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <main className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-700 text-white shadow-sm">
            <UserPlus size={20} aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Were you invited? Use the email address the invite was sent to.
          </p>
        </div>

        {done ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            Account created. Check your inbox for a confirmation link, then{" "}
            <Link href="/login" className="font-medium underline">
              sign in
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                minLength={MIN_PASSWORD}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputClass}
                aria-describedby="password-hint"
              />
              <span id="password-hint" className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                At least {MIN_PASSWORD} characters, with a letter and a number.
              </span>
            </label>

            {/* Honeypot field, kept off-screen and out of the tab order. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

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
              {loading ? "Creating account..." : "Sign up"}
            </button>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              By signing up you agree to the{" "}
              <Link href="/terms" className="underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-700 hover:underline dark:text-orange-400">
            Sign in
          </Link>
        </p>
        <AuthFooter />
      </main>
    </div>
  );
}
