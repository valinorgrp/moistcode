import Link from "next/link";

/** 16px text on phones so iOS doesn't zoom the page when a field is tapped. */
export const authInputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white";

/** Supabase auth errors, reworded so people know what to do next. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again or reset your password.";
  if (m.includes("email not confirmed")) return "Confirm your email first: check your inbox for the link we sent.";
  if (m.includes("captcha")) return "The bot check didn't go through. Complete it again and retry.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a few minutes and try again.";
  if (m.includes("already registered")) return "There's already an account with that email. Sign in instead.";
  if (m.includes("password")) return message;
  return message || "Something went wrong. Check your connection and try again.";
}

export function AuthFooter() {
  return (
    <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-400">
      <Link href="/terms" className="underline hover:text-slate-900 dark:hover:text-white">
        Terms
      </Link>
      {" · "}
      <Link href="/privacy" className="underline hover:text-slate-900 dark:hover:text-white">
        Privacy
      </Link>
      {" · "}
      Valinor Group LLC
    </p>
  );
}
