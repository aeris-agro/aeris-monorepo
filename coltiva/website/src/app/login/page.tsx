"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { SiteNav } from "@/components/SiteNav";
import { requestOtp, ApiError } from "@/lib/api";
import { setPendingPhone } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";

export default function LoginPage() {
  const router = useRouter();
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    let normalized: string;
    try {
      normalized = normalizePhone(phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid phone number");
      return;
    }

    setLoading(true);
    try {
      await requestOtp(normalized);
      setPendingPhone(normalized);
      router.push("/verify");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Could not connect. Check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="aeris-section" style={{ paddingTop: "3rem" }}>
        <div className="aeris-container">
          <div style={{ maxWidth: "440px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h1 className="aeris-h1" style={{ marginBottom: "0.5rem" }}>
                Welcome back
              </h1>
              <p className="aeris-body" style={{ margin: 0 }}>
                Enter your phone to receive a login code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="aeris-card" style={{ padding: "2rem" }}>
              <label className="aeris-label" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+256 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                className="aeris-input"
              />

              {error && <div className="aeris-error">{error}</div>}

              <button
                type="submit"
                className="aeris-btn-primary"
                disabled={loading || !phone}
                style={{ width: "100%", marginTop: "1.5rem" }}
              >
                {loading ? <span className="aeris-spinner" /> : null}
                {loading ? "Sending code…" : "Send login code"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                marginTop: "1.5rem",
                fontSize:  "var(--text-md)",
                color:     "var(--fg-muted)",
              }}
            >
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
