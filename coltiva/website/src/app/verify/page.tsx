"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteNav } from "@/components/SiteNav";
import {
  verifyOtp,
  signupComplete,
  requestOtp,
  ApiError,
} from "@/lib/api";
import {
  getPendingPhone,
  clearPendingPhone,
  saveSession,
  redirectToDashboard,
} from "@/lib/session";
import { formatPhoneDisplay } from "@/lib/phone";

type Stage = "verify" | "complete-profile" | "redirecting";

export default function VerifyPage() {
  const router = useRouter();
  const [phone,        setPhone]        = useState<string | null>(null);
  const [stage,        setStage]        = useState<Stage>("verify");
  const [signupToken,  setSignupToken]  = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Read pending phone on mount; if missing, redirect home
  useEffect(() => {
    const p = getPendingPhone();
    if (!p) {
      router.replace("/signup");
      return;
    }
    setPhone(p);
  }, [router]);

  // Cooldown timer for "Resend code"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!phone) return null;

  return (
    <>
      <SiteNav />
      <main className="aeris-section" style={{ paddingTop: "3rem" }}>
        <div className="aeris-container">
          <div style={{ maxWidth: "440px", margin: "0 auto" }}>
            {stage === "verify" && (
              <VerifyStage
                phone           = {phone}
                error           = {error}
                loading         = {loading}
                resendCooldown  = {resendCooldown}
                onSubmit        = {handleVerify}
                onResend        = {handleResend}
                onChangePhone   = {() => {
                  clearPendingPhone();
                  router.push("/signup");
                }}
              />
            )}

            {stage === "complete-profile" && signupToken && (
              <CompleteProfileStage
                signupToken={signupToken}
                onError={setError}
                error={error}
                loading={loading}
                onSubmit={handleProfileComplete}
              />
            )}

            {stage === "redirecting" && (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <span className="aeris-spinner" style={{ borderTopColor: "var(--accent)" }} />
                <p className="aeris-body" style={{ marginTop: "1rem" }}>
                  Opening your dashboard…
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  async function handleVerify(code: string) {
    if (!phone) return;
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);

      if (res.requires_profile_completion && res.signup_token) {
        // New user → ask for full name + role
        setSignupToken(res.signup_token);
        setStage("complete-profile");
      } else if (res.access_token && res.refresh_token && res.user_profile) {
        // Existing user → store session and redirect to dashboard
        saveSession(res.access_token, res.refresh_token, res.user_profile);
        clearPendingPhone();
        setStage("redirecting");
        redirectToDashboard(res.access_token, res.refresh_token, res.user_profile);
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!phone || resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not resend code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileComplete(params: {
    full_name:  string;
    role:       "farmer" | "cooperative_admin" | "field_agent";
    district?:  string;
  }) {
    if (!signupToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await signupComplete({ signup_token: signupToken, ...params });
      saveSession(res.access_token, res.refresh_token, res.user_profile);
      clearPendingPhone();
      setStage("redirecting");
      redirectToDashboard(res.access_token, res.refresh_token, res.user_profile);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not complete signup.");
    } finally {
      setLoading(false);
    }
  }
}

// ── Stage 1: enter the code ───────────────────────────────────────────────
function VerifyStage({
  phone,
  error,
  loading,
  resendCooldown,
  onSubmit,
  onResend,
  onChangePhone,
}: {
  phone:          string;
  error:          string | null;
  loading:        boolean;
  resendCooldown: number;
  onSubmit:       (code: string) => void;
  onResend:       () => void;
  onChangePhone:  () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, v: string) {
    const cleaned = v.replace(/\D/g, "").slice(-1);
    const next    = [...digits];
    next[i] = cleaned;
    setDigits(next);
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      onSubmit(next.join(""));
    }
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const next = pasted.split("");
      setDigits(next);
      onSubmit(pasted);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 className="aeris-h1" style={{ marginBottom: "0.5rem" }}>
          Enter your code
        </h1>
        <p className="aeris-body" style={{ margin: 0 }}>
          We sent a 6-digit code to{" "}
          <strong style={{ color: "var(--fg)" }}>{formatPhoneDisplay(phone)}</strong>.
        </p>
      </div>

      <div className="aeris-card" style={{ padding: "2rem" }}>
        <div className="otp-grid">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              disabled={loading}
              className="otp-input"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="aeris-error" style={{ textAlign: "center", marginTop: "1rem" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <span className="aeris-spinner" style={{ borderTopColor: "var(--accent)" }} />
          </div>
        )}

        <div
          style={{
            textAlign:  "center",
            marginTop:  "1.5rem",
            fontSize:   "var(--text-md)",
            color:      "var(--fg-muted)",
          }}
        >
          Didn&apos;t receive it?{" "}
          {resendCooldown > 0 ? (
            <span style={{ color: "var(--fg-dim)" }}>Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              style={{
                background:  "none",
                border:      "none",
                color:       "var(--accent)",
                fontWeight:  600,
                cursor:      loading ? "not-allowed" : "pointer",
                padding:     0,
                fontSize:    "inherit",
                fontFamily:  "inherit",
              }}
            >
              Resend
            </button>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "0.75rem",
            fontSize:  "var(--text-sm)",
          }}
        >
          <button
            type="button"
            onClick={onChangePhone}
            style={{
              background: "none",
              border:     "none",
              color:      "var(--fg-dim)",
              cursor:     "pointer",
              padding:    0,
              fontFamily: "inherit",
              fontSize:   "inherit",
              textDecoration: "underline",
            }}
          >
            Use a different number
          </button>
        </div>
      </div>
    </>
  );
}

// ── Stage 2: complete profile ─────────────────────────────────────────────
function CompleteProfileStage({
  loading,
  error,
  onSubmit,
}: {
  signupToken: string;
  error:       string | null;
  loading:     boolean;
  onError:     (e: string | null) => void;
  onSubmit: (params: {
    full_name: string;
    role:      "farmer" | "cooperative_admin" | "field_agent";
    district?: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [role,     setRole]     = useState<"farmer" | "cooperative_admin" | "field_agent">("farmer");
  const [district, setDistrict] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ full_name: fullName.trim(), role, district: district.trim() || undefined });
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 className="aeris-h1" style={{ marginBottom: "0.5rem" }}>
          One last thing
        </h1>
        <p className="aeris-body" style={{ margin: 0 }}>
          Tell us who you are so your dashboard fits your role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="aeris-card" style={{ padding: "2rem" }}>
        <label className="aeris-label" htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          className="aeris-input"
        />

        <label className="aeris-label" htmlFor="role" style={{ marginTop: "1.25rem" }}>
          I am a…
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          disabled={loading}
          className="aeris-input"
        >
          <option value="farmer">Farmer</option>
          <option value="cooperative_admin">Cooperative admin</option>
          <option value="field_agent">Field agent</option>
        </select>

        <label className="aeris-label" htmlFor="district" style={{ marginTop: "1.25rem" }}>
          District <span style={{ color: "var(--fg-dim)", fontWeight: 400 }}>(optional)</span>
        </label>
        <select
          id="district"
          name="district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={loading}
          className="aeris-input"
        >
          <option value="">Select your district</option>
          <option value="Lira">Lira</option>
          <option value="Alebtong">Alebtong</option>
          <option value="Dokolo">Dokolo</option>
          <option value="Oyam">Oyam</option>
          <option value="Apac">Apac</option>
          <option value="Kole">Kole</option>
        </select>

        {error && <div className="aeris-error">{error}</div>}

        <button
          type="submit"
          className="aeris-btn-primary"
          disabled={loading || fullName.trim().length < 2}
          style={{ width: "100%", marginTop: "1.5rem" }}
        >
          {loading ? <span className="aeris-spinner" /> : null}
          {loading ? "Creating your account…" : "Open my dashboard"}
        </button>
      </form>
    </>
  );
}
