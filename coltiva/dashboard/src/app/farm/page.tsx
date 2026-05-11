"use client";

import { useEffect, useState } from "react";
import { MapPin, Building2, Sprout } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { getUserProfile } from "@/lib/session";
import type { UserProfile } from "@/lib/session";

export default function FarmPage() {
  return (
    <AuthGate>
      <AppShell>
        <FarmBody />
      </AppShell>
    </AuthGate>
  );
}

function FarmBody() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  if (!profile) return null;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Your farm</h1>
        <p className="page-subtitle">
          Where Coltiva is delivering advice. Keep this up to date in your profile.
        </p>
      </header>

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 "1rem",
          marginBottom:        "2rem",
        }}
      >
        <InfoTile
          icon={MapPin}
          label="District"
          value={profile.district ?? "Not set"}
        />
        <InfoTile
          icon={Building2}
          label="Sub-county"
          value={profile.sub_county_id ? "Auto-detected" : "Not set"}
        />
        <InfoTile
          icon={Sprout}
          label="Role"
          value={profile.role.replace(/_/g, " ")}
          capitalize
        />
      </div>

      <div className="aeris-card" style={{ padding: "1.75rem" }}>
        <h2
          style={{
            fontSize:    "var(--text-xl)",
            fontWeight:  700,
            color:       "var(--fg)",
            margin:      "0 0 0.5rem",
          }}
        >
          Plots
        </h2>
        <p
          style={{
            fontSize: "var(--text-md)",
            color:    "var(--fg-muted)",
            margin:   "0 0 1.25rem",
            lineHeight: 1.6,
          }}
        >
          You haven&apos;t registered any plots yet. Plots help Coltiva tailor
          weather, soil, and pest advice to the exact location of your farm.
        </p>

        <button
          type="button"
          className="aeris-btn-primary"
          disabled
          title="Plot registration is coming soon"
        >
          Register a plot (coming soon)
        </button>
      </div>
    </>
  );
}

function InfoTile({
  icon: Icon, label, value, capitalize,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="aeris-card" style={{ padding: "1.5rem" }}>
      <div
        style={{
          width:          "40px",
          height:         "40px",
          borderRadius:   "10px",
          background:     "var(--tag-bg)",
          color:          "var(--accent)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginBottom:   "0.875rem",
        }}
      >
        <Icon size={20} />
      </div>
      <div
        style={{
          fontSize:       "var(--text-xs)",
          fontWeight:     700,
          letterSpacing:  "0.1em",
          textTransform:  "uppercase",
          color:          "var(--fg-dim)",
          marginBottom:   "0.25rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize:        "var(--text-xl)",
          fontWeight:      700,
          color:           "var(--fg)",
          textTransform:   capitalize ? "capitalize" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
