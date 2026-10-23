import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the Pipeline CRM handles your account and the business records you keep in it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 23, 2026">
      <p>
        Pipeline is a sales and operations app run by Valinor Group LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;), based in
        Pennsylvania, United States. This policy covers the app at this address. Our public website has{" "}
        <a href="https://valinorgrpllc.com/privacy">its own privacy policy</a>.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <b>Your account:</b> your email address and a password. Passwords are stored by our authentication provider
            as a one-way hash; we can&apos;t read them.
          </li>
          <li>
            <b>Records your team enters:</b> leads, customers and their contact details, quotes, orders, jobs, schedules,
            notes, team members and their roles.
          </li>
          <li>
            <b>An activity log</b> of changes (who changed what, and when), so your team can see what happened.
          </li>
          <li>
            <b>Basic technical data</b> such as IP address and browser type in server logs, used for security and to keep
            the service running.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          Only to run the app for you and your team: storing your records, showing them to the people you&apos;ve added
          to your workspace, keeping the service secure, and fixing problems. We don&apos;t sell personal information,
          we don&apos;t use it for advertising, and we don&apos;t use your records to train AI models.
        </p>
      </section>

      <section>
        <h2>Who can see your records</h2>
        <p>
          Records belong to a workspace. Only people that workspace&apos;s owner or admins have added can see them, with
          the access their role allows. If you keep information about your own customers in Pipeline, your business
          decides what to store and is responsible for having a lawful reason to keep it; we handle it on your behalf.
        </p>
      </section>

      <section>
        <h2>Services we rely on</h2>
        <ul>
          <li>
            <b>Supabase</b> stores the database and handles sign-in.
          </li>
          <li>
            <b>Vercel</b> hosts the app. If page-view analytics are turned on, they use Vercel Web Analytics, which does
            not use cookies and doesn&apos;t identify individual visitors.
          </li>
          <li>
            <b>Anthropic</b> processes the text you type or speak into Quick chat so it can draft a lead, quote or
            activity for you to review. Only that message is sent, not your other records.
          </li>
          <li>
            <b>Voice input</b> uses your browser&apos;s built-in speech recognition; your browser&apos;s maker (for
            example Google or Apple) may process the audio under its own terms.
          </li>
          <li>
            <b>Cloudflare Turnstile</b>, if enabled, checks sign-in and sign-up forms for bots.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We only use the cookies needed to keep you signed in. There are no advertising or tracking cookies, which is
          why there&apos;s no cookie banner. If you block these cookies you won&apos;t be able to sign in.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep workspace records while the workspace is active. When a workspace owner asks us to delete it, we delete
          its records within 30 days, apart from backups, which roll off on their normal schedule, and anything we have
          to keep for legal or accounting reasons.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask to see, correct, export or delete your information at any time by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If you&apos;re a customer of a business that uses
          Pipeline, contact that business first; we&apos;ll help them with your request. This applies wherever you live,
          including if you have rights under California, other U.S. state, or international privacy law.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Connections are encrypted (HTTPS), each workspace&apos;s records are walled off from others at the database
          level, and access follows the roles your workspace sets. No system is perfectly secure, and we can&apos;t
          guarantee absolute security. If we learn of a breach affecting your information, we&apos;ll tell you without
          undue delay.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Pipeline is a business tool and isn&apos;t meant for anyone under 16.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If we change this policy we&apos;ll update this page and the date above, and tell workspace owners about
          significant changes.
        </p>
      </section>
    </LegalPage>
  );
}
