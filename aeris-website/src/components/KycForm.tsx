"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { value: "farmer_cooperative",   label: "Farmer cooperative" },
  { value: "investor",             label: "Investor / VC" },
  { value: "government_partner",   label: "Government partner" },
  { value: "commodity_buyer",      label: "Commodity buyer / processor" },
  { value: "input_supplier",       label: "Input supplier (seeds, fertiliser)" },
  { value: "development_partner",  label: "Development partner / NGO" },
] as const;

const COUNTRIES = [
  "Uganda", "Kenya", "Tanzania", "Rwanda", "Ethiopia",
  "United Kingdom", "United States", "Netherlands", "Germany", "Other",
];

interface FormState {
  full_name:    string;
  email:        string;
  phone:        string;
  country:      string;
  district:     string;
  organisation: string;
  category:     string;
  message:      string;
}

const EMPTY: FormState = {
  full_name: "", email: "", phone: "",
  country: "Uganda", district: "", organisation: "",
  category: "", message: "",
};

export function KycForm() {
  const [form,  setForm]  = useState<FormState>(EMPTY);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done,  setDone]  = useState(false);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.full_name.trim().length < 2)                    return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.phone.trim().length < 5)                        return setError("Please enter your phone number.");
    if (!form.category)                                      return setError("Please select what best describes you.");

    setBusy(true);
    try {
      const res = await fetch("/api/kyc/lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = (await res.json()) as { id?: string; detail?: string };
      if (!res.ok) throw new Error(data.detail ?? "Submission failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        className="aeris-card"
        style={{
          padding: "3rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
        }}
      >
        <CheckCircle2 size={48} style={{ color: "var(--accent)" }} />
        <h3 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          Thank you. We received it.
        </h3>
        <p style={{ fontSize: "var(--text-md)", color: "var(--fg-muted)", maxWidth: "440px", lineHeight: 1.6, margin: 0 }}>
          A member of the AERIS team will be in touch within 5 working days.
          For urgent matters, email{" "}
          <a href="mailto:hello@aerisagro.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            hello@aerisagro.com
          </a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="aeris-card" style={{ padding: "2rem" }}>
      <div className="kyc-form">
        <Field label="Full name" required input={
          <input
            type="text" required minLength={2} maxLength={120}
            value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
            disabled={busy} className="aeris-input" autoComplete="name"
          />
        } />

        <Field label="What best describes you?" required input={
          <select
            required value={form.category}
            onChange={(e) => update("category", e.target.value)}
            disabled={busy} className="aeris-select"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        } />

        <Field label="Email" required input={
          <input
            type="email" required
            value={form.email} onChange={(e) => update("email", e.target.value)}
            disabled={busy} className="aeris-input" autoComplete="email"
          />
        } />

        <Field label="Phone" required input={
          <input
            type="tel" required
            value={form.phone} onChange={(e) => update("phone", e.target.value)}
            disabled={busy} className="aeris-input" autoComplete="tel"
            placeholder="+256 7XX XXX XXX"
          />
        } />

        <Field label="Country" required input={
          <select
            required value={form.country}
            onChange={(e) => update("country", e.target.value)}
            disabled={busy} className="aeris-select" autoComplete="country-name"
          >
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        } />

        <Field label="District / region" input={
          <input
            type="text"
            value={form.district} onChange={(e) => update("district", e.target.value)}
            disabled={busy} className="aeris-input"
            placeholder="e.g. Lira"
          />
        } />

        <div className="kyc-full">
          <Field label="Organisation (optional)" input={
            <input
              type="text"
              value={form.organisation} onChange={(e) => update("organisation", e.target.value)}
              disabled={busy} className="aeris-input" autoComplete="organization"
            />
          } />
        </div>

        <div className="kyc-full">
          <Field label="How can we help?" input={
            <textarea
              value={form.message} onChange={(e) => update("message", e.target.value)}
              disabled={busy} className="aeris-textarea" rows={4}
              placeholder="Tell us briefly what you're looking to do with AERIS — partnership, investment, procurement, research, anything."
            />
          } />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "1rem", padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            background: "rgba(232,93,93,0.08)",
            border: "1px solid rgba(232,93,93,0.25)",
            color: "var(--aeris-red)",
            fontSize: "var(--text-md)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit" className="aeris-btn-primary"
        disabled={busy}
        style={{ marginTop: "1.5rem", width: "100%" }}
      >
        {busy ? <span className="aeris-spinner" /> : <Send size={18} />}
        {busy ? "Sending…" : "Send to AERIS"}
      </button>

      <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-dim)", marginTop: "1rem", textAlign: "center" }}>
        We&apos;ll respond within 5 working days. Your details are stored securely and never shared with third parties.
      </p>
    </form>
  );
}

function Field({
  label, required, input,
}: { label: string; required?: boolean; input: React.ReactNode }) {
  return (
    <div>
      <label className="aeris-label">
        {label}
        {required && <span style={{ color: "var(--aeris-red)", marginLeft: "0.25rem" }} aria-hidden>*</span>}
      </label>
      {input}
    </div>
  );
}
