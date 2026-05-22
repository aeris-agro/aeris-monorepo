import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AERIS Agro handles contact and partnership enquiry data.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="aeris-container">
        <Link href="/" className="legal-back">Back to AERIS Agro</Link>

        <header className="legal-header">
          <div className="section-eyebrow">Privacy Policy</div>
          <h1 className="aeris-h1">How we handle your information.</h1>
          <p className="aeris-body">
            This policy explains how AERIS Agro Ltd handles information submitted
            through this website, especially partnership and contact enquiries.
          </p>
          <p className="legal-updated">Last updated: May 22, 2026</p>
        </header>

        <section className="legal-card">
          <h2>Information we collect</h2>
          <p>
            When you submit the partner form, we collect the details you provide:
            name, email address, phone number, country, district or region,
            organisation, partner category, partnership interest, and message.
          </p>
          <p>
            We also collect basic request metadata such as IP address and browser
            user agent. This helps us protect the form from spam and understand
            submission context.
          </p>

          <h2>How we use it</h2>
          <p>
            We use submitted information to review enquiries, route them to the
            relevant AERIS lead, respond to partnership requests, and maintain a
            basic record of prospective partner conversations.
          </p>

          <h2>How we store it</h2>
          <p>
            Partner enquiries are stored in our Supabase database. Access is
            limited to team members who need the information to respond to or
            manage the enquiry.
          </p>

          <h2>Sharing</h2>
          <p>
            We do not sell your personal information. We do not share partner
            enquiry details with third parties for marketing. We may disclose
            information where required by law or to protect the security and
            integrity of our services.
          </p>

          <h2>Retention</h2>
          <p>
            We keep enquiry records for as long as needed to manage the partner
            relationship, follow up on legitimate business discussions, or meet
            operational and legal requirements.
          </p>

          <h2>Your choices</h2>
          <p>
            You can request access, correction, or deletion of your enquiry data
            by contacting us. We may need to verify your identity before acting
            on the request.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions, email{" "}
            <a href="mailto:aerisagro@gmail.com">aerisagro@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
