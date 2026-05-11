"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, Sprout, ArrowRight } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { getUserProfile } from "@/lib/session";
import type { UserProfile } from "@/lib/session";

export default function HomePage() {
  return (
    <AuthGate>
      <AppShell>
        <HomeBody />
      </AppShell>
    </AuthGate>
  );
}

function HomeBody() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  const firstName = profile?.full_name.split(" ")[0] ?? "there";
  const greeting  = greet();

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">{greeting}, {firstName}.</h1>
        <p className="page-subtitle">
          Here&apos;s what&apos;s happening on your farm today.
        </p>
      </header>

      {/* Quick cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 "1rem",
          marginBottom:        "2rem",
        }}
      >
        <QuickCard
          tag="Today"
          title="No active alerts"
          body="Your farm is in good shape. No drought, pest, or flood warnings in your area."
          tone="ok"
        />
        <QuickCard
          tag="This week"
          title="18mm rain expected"
          body="Forecast shows steady rain over the next 7 days — good for maize at this growth stage."
          tone="info"
        />
        <QuickCard
          tag="Market"
          title="Maize · UGX 750/kg"
          body="Up 4% from last week in Lira. Fair price to sell if you have stock."
          tone="info"
        />
      </div>

      {/* CTAs */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap:                 "1rem",
        }}
      >
        <ActionCard
          icon={MessageCircle}
          title="Have a farming question?"
          body="Ask Coltiva in plain English or Luo. Get advice grounded in your district's weather, soil, and market."
          href="/chat"
          cta="Start a chat"
        />
        <ActionCard
          icon={Sprout}
          title="Review your farm"
          body="Check your district, sub-county, and registered plots. Keep your profile up to date for better advice."
          href="/farm"
          cta="View farm"
        />
      </div>
    </>
  );
}

function greet() {
  if (typeof window === "undefined") return "Hello";
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function QuickCard({
  tag, title, body, tone,
}: {
  tag: string; title: string; body: string; tone: "ok" | "info" | "warn";
}) {
  const accent = tone === "ok" ? "var(--accent)" : tone === "warn" ? "#c0392b" : "var(--aeris-gold)";
  return (
    <div className="aeris-card" style={{ padding: "1.5rem" }}>
      <span
        className="aeris-tag"
        style={{
          marginBottom:   "0.875rem",
          display:        "inline-flex",
          color:          accent,
          background:     `${accent}15`,
          borderColor:    `${accent}40`,
        }}
      >
        {tag}
      </span>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--fg)", margin: "0 0 0.5rem" }}>
        {title}
      </h3>
      <p style={{ fontSize: "var(--text-md)", color: "var(--fg-muted)", margin: 0, lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}

function ActionCard({
  icon: Icon, title, body, href, cta,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string; body: string; href: string; cta: string;
}) {
  return (
    <Link
      href={href}
      className="aeris-card"
      style={{
        padding:        "1.75rem",
        display:        "flex",
        flexDirection:  "column",
        gap:            "0.875rem",
        textDecoration: "none",
        color:          "inherit",
        transition:     "border-color var(--transition), transform var(--transition), box-shadow var(--transition)",
      }}
    >
      <div
        style={{
          width:          "44px",
          height:         "44px",
          borderRadius:   "12px",
          background:     "var(--tag-bg)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          "var(--accent)",
        }}
      >
        <Icon size={22} />
      </div>
      <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: "var(--text-md)", color: "var(--fg-muted)", margin: 0, lineHeight: 1.6 }}>
        {body}
      </p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)", fontWeight: 600, fontSize: "var(--text-md)", marginTop: "0.25rem" }}>
        {cta} <ArrowRight size={16} />
      </div>
    </Link>
  );
}
