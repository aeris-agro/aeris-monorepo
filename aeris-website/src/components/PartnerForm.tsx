"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const INTERESTS = [
  { value: "investment", label: "Investment" },
  { value: "government_deployment", label: "Public-sector program" },
  { value: "commodity_sourcing", label: "Commodity sourcing" },
  { value: "cooperative_onboarding", label: "Farmer or cooperative support" },
  { value: "data_research", label: "Research partnership" },
] as const;

const CATEGORY_BY_INTEREST: Record<string, string> = {
  investment: "investor",
  government_deployment: "government_partner",
  commodity_sourcing: "commodity_buyer",
  cooperative_onboarding: "farmer_cooperative",
  data_research: "development_partner",
};

const COUNTRIES = [
  "Uganda", "Kenya", "Tanzania", "Rwanda", "Ethiopia",
  "United Kingdom", "United States", "Netherlands", "Germany", "Other",
];

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  district: string;
  organisation: string;
  interest: string;
  message: string;
  website: string;
}

const EMPTY: FormState = {
  full_name: "",
  email: "",
  phone: "",
  country: "Uganda",
  district: "",
  organisation: "",
  interest: "",
  message: "",
  website: "",
};

export function PartnerForm() {
  const formStartedAt = useMemo(() => Date.now(), []);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get("interest");
    if (interest && INTERESTS.some((item) => item.value === interest)) {
      update("interest", interest);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.full_name.trim().length < 2) {
      return setError("Please enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (form.phone.trim().length < 5) {
      return setError("Please enter your phone number.");
    }
    if (!form.interest) {
      return setError("Please select what you want help with.");
    }
    if (form.message.trim().length < 2) {
      return setError("Please add a short note about your request.");
    }

    const category = CATEGORY_BY_INTEREST[form.interest];
    if (!category) {
      return setError("Please select a valid request type.");
    }

    setBusy(true);
    try {
      const res = await fetch("/api/kyc/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          district: form.district,
          organisation: form.organisation,
          category,
          interest: form.interest,
          message: formatPartnerMessage(form.interest, form.message),
          website: form.website,
          form_started_at: formStartedAt,
        }),
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
      <div className="aeris-card kyc-success-card">
        <CheckCircle2 size={44} className="kyc-success-icon" />
        <h3>Thank you. We received your request.</h3>
        <p>A relevant AERIS lead will review it within 5 working days.</p>
        <div className="kyc-success-actions">
          <Link href="/" className="aeris-btn-ghost">
            Back to home
          </Link>
          <Link href="/faq" className="aeris-btn-primary">
            Read the FAQ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="aeris-card partner-form-card">
      <div className="kyc-form">
        <div className="kyc-honeypot" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>

        <Field
          label="Full name"
          required
          input={
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              disabled={busy}
              className="aeris-input"
              autoComplete="name"
            />
          }
        />

        <Field
          label="Email"
          required
          input={
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={busy}
              className="aeris-input"
              autoComplete="email"
            />
          }
        />

        <Field
          label="Phone"
          required
          input={
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              disabled={busy}
              className="aeris-input"
              autoComplete="tel"
              placeholder="+256 7XX XXX XXX"
            />
          }
        />

        <Field
          label="What do you need help with?"
          required
          input={
            <select
              required
              value={form.interest}
              onChange={(e) => update("interest", e.target.value)}
              disabled={busy}
              className="aeris-select"
            >
              <option value="">Select one</option>
              {INTERESTS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          }
        />

        <Field
          label="Country"
          input={
            <select
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              disabled={busy}
              className="aeris-select"
              autoComplete="country-name"
            >
              {COUNTRIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          }
        />

        <Field
          label="District or region"
          input={
            <input
              type="text"
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              disabled={busy}
              className="aeris-input"
              placeholder="Example: Lira"
            />
          }
        />

        <Field
          label="Organisation"
          hint="Optional"
          input={
            <input
              type="text"
              value={form.organisation}
              onChange={(e) => update("organisation", e.target.value)}
              disabled={busy}
              className="aeris-input"
              autoComplete="organization"
            />
          }
        />

        <Field
          label="Short note"
          full
          required
          hint="Tell us what you want to solve or build."
          input={
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              disabled={busy}
              className="aeris-textarea"
              rows={4}
              placeholder="Add a short note about your request."
              required
            />
          }
        />
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="kyc-actions">
        <button type="submit" className="aeris-btn-primary" disabled={busy}>
          {busy ? <span className="aeris-spinner" /> : <Send size={18} />}
          {busy ? "Sending..." : "Send request"}
        </button>
        <Link href="/questions" className="aeris-btn-ghost">
          Questions or comments
        </Link>
      </div>

      <p className="kyc-footnote">
        We only use your details to respond to your request.{" "}
        <Link href="/privacy">Privacy Policy</Link>
      </p>
    </form>
  );
}

function formatPartnerMessage(interest: string, message: string): string {
  const label = INTERESTS.find((item) => item.value === interest)?.label ?? interest;
  return [`Interest: ${label}`, message.trim()].join("\n\n");
}

function Field({
  label,
  required,
  hint,
  input,
  full,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  input: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "kyc-full" : undefined}>
      <label className="aeris-label">
        {label}
        {required && <span style={{ color: "var(--aeris-red)", marginLeft: "0.25rem" }} aria-hidden>*</span>}
      </label>
      {input}
      {hint && <p className="aeris-hint">{hint}</p>}
    </div>
  );
}
