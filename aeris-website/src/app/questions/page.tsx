import type { Metadata } from "next";
import Link from "next/link";
import { FaqQuestionForm } from "@/components/FaqQuestionForm";

export const metadata: Metadata = {
  title: "Questions or comments",
  description: "Send a question or comment to help improve the AERIS website.",
};

export default function QuestionsPage() {
  return (
    <main className="legal-page faq-page">
      <div className="aeris-container">
        <Link href="/" className="legal-back">Back to AERIS Agro</Link>

        <header className="legal-header">
          <div className="section-eyebrow">Questions or comments</div>
          <h1 className="aeris-h1">Send a question or comment.</h1>
          <p className="aeris-body">
            If something is unclear or missing, send it here. We use these notes to improve the FAQ and follow up when needed.
          </p>
        </header>

        <FaqQuestionForm />
      </div>
    </main>
  );
}
