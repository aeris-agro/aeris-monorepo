"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

interface FaqFormState {
  name: string;
  email: string;
  question: string;
  website: string;
}

const EMPTY: FaqFormState = {
  name: "",
  email: "",
  question: "",
  website: "",
};

export function FaqQuestionForm() {
  const formStartedAt = useMemo(() => Date.now(), []);
  const [form, setForm] = useState<FaqFormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FaqFormState>(key: K, val: FaqFormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.question.trim().length < 10) return setError("Please add your question or comment.");

    setBusy(true);
    try {
      const res = await fetch("/api/faq/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, form_started_at: formStartedAt }),
      });
      const data = (await res.json()) as { detail?: string };
      if (!res.ok) throw new Error(data.detail ?? "Submission failed");
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="faq-submit-card is-done">
        <CheckCircle2 size={40} />
        <h2>Thank you. We received your question.</h2>
        <p>We review FAQ comments and use them to improve the information on this page.</p>
      </div>
    );
  }

  return (
    <form className="faq-submit-card" onSubmit={handleSubmit}>
      <div className="section-eyebrow">Ask a question</div>
      <h2>Add a question or comment</h2>
      <p>
        If something is unclear, send it here. We use these notes to improve
        the FAQ and follow up when needed.
      </p>

      <div className="kyc-honeypot" aria-hidden="true">
        <label htmlFor="faq-website">Website</label>
        <input
          id="faq-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <div className="faq-submit-grid">
        <label>
          <span>Name</span>
          <input
            className="aeris-input"
            value={form.name}
            disabled={busy}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            className="aeris-input"
            type="email"
            value={form.email}
            disabled={busy}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="faq-submit-full">
          <span>Question or comment</span>
          <textarea
            className="aeris-textarea"
            value={form.question}
            disabled={busy}
            onChange={(e) => update("question", e.target.value)}
            placeholder="What would you like us to explain more clearly?"
            required
          />
        </label>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <button className="aeris-btn-primary faq-submit-button" type="submit" disabled={busy}>
        {busy ? <span className="aeris-spinner" /> : <Send size={18} />}
        {busy ? "Sending..." : "Send question"}
      </button>
    </form>
  );
}
