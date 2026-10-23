import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using the Pipeline CRM.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="October 23, 2026">
      <p>
        These terms cover your use of Pipeline, a sales and operations app provided by Valinor Group LLC
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the app, you agree to them. If you use
        Pipeline for a business, you agree on that business&apos;s behalf.
      </p>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Give accurate sign-up information and keep your password private.</li>
          <li>You&apos;re responsible for what happens under your account. Tell us right away if you think it&apos;s been misused.</li>
          <li>Workspace owners and admins decide who joins their workspace and what each person can do.</li>
        </ul>
      </section>

      <section>
        <h2>Your records</h2>
        <p>
          The records you and your team put into Pipeline remain yours. You give us permission to store and process them
          only as needed to run the app for you. You&apos;re responsible for having the right to store any personal
          information you enter about other people, such as your customers. You can ask us to export or delete your
          workspace at any time.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Don&apos;t use Pipeline to:</p>
        <ul>
          <li>break the law or anyone else&apos;s rights, or store information you aren&apos;t allowed to have;</li>
          <li>send spam or harass anyone;</li>
          <li>try to get into another workspace, get around access controls, or disrupt the service;</li>
          <li>upload malware, or overload the app with automated requests.</li>
        </ul>
        <p>We may suspend accounts that do these things.</p>
      </section>

      <section>
        <h2>AI drafts</h2>
        <p>
          Quick chat uses AI to suggest leads, quotes and activities from what you type or say. Suggestions can be wrong:
          review each one before saving it. You&apos;re responsible for what you save.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          We work to keep Pipeline running and your records safe, but the service is provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, to the extent the law allows. We may change or
          improve features over time and will give reasonable notice before removing anything significant.
        </p>
      </section>

      <section>
        <h2>Limits on liability</h2>
        <p>
          To the extent the law allows, Valinor Group LLC isn&apos;t liable for indirect, incidental or consequential
          losses, or lost profits or data, from your use of Pipeline. Our total liability for any claim is limited to the
          amount you paid us for Pipeline in the 12 months before the claim, or $100 if you paid nothing.
        </p>
      </section>

      <section>
        <h2>Ending your use</h2>
        <p>
          You can stop using Pipeline at any time. We may suspend or end access if these terms are broken. Either way,
          you can ask for an export of your workspace&apos;s records within 30 days.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the Commonwealth of Pennsylvania, USA.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
