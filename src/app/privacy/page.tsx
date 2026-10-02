import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pipeline (Valinor Group LLC) handles account and lead data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Last updated: October 2, 2026
      </p>

      <div className="mt-8 space-y-6 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Pipeline is an internal sales and lead-tracking tool built and used
          by Valinor Group LLC. It isn&apos;t a public product, and accounts
          are issued only to Valinor Group team members — this page explains
          how it handles data for anyone who needs to know, including people
          whose information ends up in it as a lead.
        </p>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            What&apos;s stored here
          </h2>
          <p className="mt-2">
            Two kinds of data live in Pipeline: (1) account data for signed-in
            team members (email address, managed through our authentication
            provider, Supabase), and (2) lead data — name, email, phone,
            company, and message — submitted through the{" "}
            <a
              href="https://valinorgrpllc.com/contact"
              className="font-medium text-slate-900 underline dark:text-white"
            >
              valinorgrpllc.com
            </a>{" "}
            contact form, or entered directly by our team.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Cookies
          </h2>
          <p className="mt-2">
            Signing in sets a strictly-necessary session cookie (via
            Supabase) so you stay logged in — it isn&apos;t used for
            tracking or advertising, and under applicable law doesn&apos;t
            require a consent banner. Pipeline doesn&apos;t use analytics or
            advertising cookies.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            How it&apos;s used &amp; shared
          </h2>
          <p className="mt-2">
            Lead data is used only to manage and follow up on sourcing
            requests. It isn&apos;t sold or shared outside Valinor Group LLC
            and the infrastructure providers (like Supabase) that we use to
            run this tool.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Your choices
          </h2>
          <p className="mt-2">
            If your information is stored here as a lead and you&apos;d like
            to access, correct, or delete it, email{" "}
            <a
              href="mailto:phil@valinorgrpllc.com"
              className="font-medium text-slate-900 underline dark:text-white"
            >
              phil@valinorgrpllc.com
            </a>
            . See the full{" "}
            <a
              href="https://valinorgrpllc.com/privacy"
              className="font-medium text-slate-900 underline dark:text-white"
            >
              Valinor Group LLC Privacy Policy
            </a>{" "}
            for more detail on how sourcing-request data is collected and
            used.
          </p>
        </div>
      </div>
    </div>
  );
}
