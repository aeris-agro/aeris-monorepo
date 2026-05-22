import type { Metadata } from "next";
import Link from "next/link";
import { FaqQuestionForm } from "@/components/FaqQuestionForm";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Plain answers to common questions about AERIS Agro.",
};

const FAQS = [
  {
    q: "Is AERIS for farmers or institutions?",
    a: "Both. Farmers get practical guidance, while institutions and partners get a clearer picture of where support or coordination is needed.",
  },
  {
    q: "Does it work on basic phones?",
    a: "Yes. Farmers can use the service without downloading an app or buying mobile data.",
  },
  {
    q: "Which crops are supported first?",
    a: "The first focus is staple and trade crops in Northern Uganda, including maize, sesame, sorghum, and soya.",
  },
  {
    q: "Where is AERIS operating first?",
    a: "The initial rollout focus is the Lango sub-region, including Lira, Alebtong, Dokolo, and surrounding production corridors.",
  },
  {
    q: "How do partners engage?",
    a: "Partners can start a conversation about farmer support, crop sourcing, investment, research, or local deployment through the partner form.",
  },
  {
    q: "Can buyers and processors use AERIS?",
    a: "Yes. The market side is designed to help buyers find supply with clearer quality, price, and payment expectations.",
  },
];

export default function FaqPage() {
  return (
    <main className="legal-page faq-page">
      <div className="aeris-container">
        <Link href="/" className="legal-back">Back to AERIS Agro</Link>

        <header className="legal-header">
          <div className="section-eyebrow">FAQ</div>
          <h1 className="aeris-h1">Questions people ask about AERIS.</h1>
          <p className="aeris-body">
            Plain answers about who AERIS serves, how farmers access guidance,
            where we are starting, and how partners can work with us.
          </p>
        </header>

        <section className="faq-list" aria-label="Frequently asked questions">
          {FAQS.map((item) => (
            <details className="faq-detail" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>

        <FaqQuestionForm />
      </div>
    </main>
  );
}
