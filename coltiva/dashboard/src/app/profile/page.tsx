"use client";

import { useEffect, useState } from "react";
import { Save, Phone } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { getUserProfile, setUserProfile } from "@/lib/session";
import type { UserProfile } from "@/lib/session";
import { ApiError } from "@/lib/api";

const DISTRICTS = ["Lira", "Alebtong", "Dokolo", "Oyam", "Apac", "Kole"];

export default function ProfilePage() {
  return (
    <AuthGate>
      <AppShell>
        <ProfileBody />
      </AppShell>
    </AuthGate>
  );
}

function ProfileBody() {
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState<"en" | "luo">("en");
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const p = getUserProfile();
      if (p) {
        setProfile(p);
        setFullName(p.full_name);
        setDistrict(p.district ?? "");
        setLanguage(p.preferred_language);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setFeedback(null);

    try {
      // The PATCH endpoint isn't built on the backend yet — but we'll wire
      // localStorage so the UI reflects changes immediately. Once the
      // backend endpoint exists, replace the localStorage write with an
      // api.patch() call.
      const updated: UserProfile = {
        ...profile,
        full_name:          fullName.trim(),
        district:           district || null,
        preferred_language: language,
      };
      setUserProfile(updated);
      setProfile(updated);
      setFeedback({ kind: "ok", text: "Profile saved locally. Sync to server is coming soon." });
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Could not save changes.";
      setFeedback({ kind: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Your profile</h1>
        <p className="page-subtitle">
          Keep this up to date so Coltiva delivers advice for the right place and language.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="aeris-card"
        style={{ padding: "1.75rem", maxWidth: "560px" }}
      >
        {/* Phone — read-only */}
        <label className="aeris-label" htmlFor="phone">Phone number</label>
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            gap:            "0.625rem",
            background:     "var(--bg-2)",
            border:         "1px solid var(--border)",
            borderRadius:   "var(--radius-sm)",
            padding:        "0.8rem 1rem",
            color:          "var(--fg-muted)",
            marginBottom:   "0.5rem",
          }}
        >
          <Phone size={16} />
          <span style={{ fontWeight: 500 }}>{profile.phone}</span>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-dim)", marginTop: 0 }}>
          To change your phone number, log out and sign up again with the new number.
        </p>

        {/* Full name */}
        <label className="aeris-label" htmlFor="full_name" style={{ marginTop: "1.5rem" }}>
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          disabled={saving}
          className="aeris-input"
        />

        {/* District */}
        <label className="aeris-label" htmlFor="district" style={{ marginTop: "1.25rem" }}>
          District
        </label>
        <select
          id="district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={saving}
          className="aeris-input"
        >
          <option value="">Select your district</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Language */}
        <label className="aeris-label" htmlFor="language" style={{ marginTop: "1.25rem" }}>
          Preferred language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "luo")}
          disabled={saving}
          className="aeris-input"
        >
          <option value="en">English</option>
          <option value="luo">Luo</option>
        </select>

        {/* Role — read-only */}
        <label className="aeris-label" style={{ marginTop: "1.25rem" }}>Role</label>
        <div
          style={{
            background:    "var(--bg-2)",
            border:        "1px solid var(--border)",
            borderRadius:  "var(--radius-sm)",
            padding:       "0.8rem 1rem",
            color:         "var(--fg-muted)",
            textTransform: "capitalize",
          }}
        >
          {profile.role.replace(/_/g, " ")}
        </div>

        {feedback && (
          <div
            style={{
              marginTop: "1.25rem",
              padding:   "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              background:   feedback.kind === "ok" ? "rgba(34,128,63,0.08)" : "rgba(192,57,43,0.08)",
              border:       `1px solid ${feedback.kind === "ok" ? "rgba(34,128,63,0.25)" : "rgba(192,57,43,0.25)"}`,
              color:        feedback.kind === "ok" ? "var(--accent-dim)" : "#c0392b",
              fontSize:     "var(--text-md)",
            }}
          >
            {feedback.text}
          </div>
        )}

        <button
          type="submit"
          className="aeris-btn-primary"
          disabled={saving || fullName.trim().length < 2}
          style={{ marginTop: "1.5rem", width: "100%" }}
        >
          {saving ? <span className="aeris-spinner" style={{ borderTopColor: "#fff" }} /> : <Save size={16} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}
