import type { Metadata } from "next";
import Link from "next/link";
import { PartnerForm } from "@/components/PartnerForm";

export const metadata: Metadata = {
  title: "Partner request",
  description: "Send a partnership, deployment, sourcing, or research request to AERIS Agro.",
};

export default function PartnerPage() {
  return (
    <main className="legal-page faq-page">
      <div className="aeris-container">
        <Link href="/" className="legal-back">Back to AERIS Agro</Link>

        <header className="legal-header">
          <div className="section-eyebrow">Partner request</div>
          <h1 className="aeris-h1">Tell us what you want to build or solve.</h1>
          <p className="aeris-body">
            Use this page for partnership requests, deployment ideas, sourcing conversations, and research collaboration.
          </p>
        </header>

        <PartnerForm />
      </div>
    </main>
  );
}
