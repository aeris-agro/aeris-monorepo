import { Satellite, Sprout, Store, ArrowRight, TrendingUp, Network, Radio, ShieldCheck } from "lucide-react";

import { SiteNav } from "@/components/SiteNav";
import { KycForm } from "@/components/KycForm";

const COLTIVA_URL   = process.env.NEXT_PUBLIC_COLTIVA_WEBSITE_URL   ?? "https://coltiva-website.vercel.app";
const AERYION_URL   = process.env.NEXT_PUBLIC_AERYION_DASHBOARD_URL ?? "";
const LINKTRADE_URL = process.env.NEXT_PUBLIC_LINKTRADE_URL         ?? "";

export default function LandingPage() {
  return (
    <div id="top">
      <a href="#main" className="skip-link">Skip to main content</a>
      <SiteNav />

      <main id="main">
        {/* ═══ HERO ═══════════════════════════════════════════════ */}
        <section className="hero">
          <div className="hero-bg" aria-hidden />
          <div className="aeris-container">
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "var(--tag-bg)", border: "1px solid var(--tag-border)",
                borderRadius: "var(--radius-pill)",
                padding: "0.4rem 1rem", marginBottom: "1.75rem",
              }}
            >
              <span
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: "var(--accent)", animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "var(--text-xs)", fontWeight: 700,
                  color: "var(--tag-color)",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                }}
              >
                Now live · Lango sub-region, Uganda
              </span>
            </div>

            <h1 className="hero-title">
              Agricultural intelligence{" "}
              <span className="green">infrastructure.</span>
              <br />
              Built for <span className="gold">Uganda&apos;s farmers.</span>
            </h1>

            <p className="hero-sub">
              AERIS Agro operates three connected platforms — environmental
              intelligence, production intelligence, and market intelligence —
              that together close the $445M agricultural intelligence gap in
              Northern Uganda.
            </p>

            <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
              <a href="#platforms" className="aeris-btn-primary">
                Explore the platforms <ArrowRight size={16} />
              </a>
              <a href="#partner" className="aeris-btn-ghost">
                Partner with us
              </a>
            </div>
          </div>
        </section>

        {/* ═══ STATS STRIP ════════════════════════════════════════ */}
        <section
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "3rem 0", background: "var(--bg-2)",
          }}
        >
          <div className="aeris-container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "2rem",
              }}
            >
              <Stat num="$445M" label="Intelligence gap" />
              <Stat num="120K"  label="Lango farmers" />
              <Stat num="800K"  label="Target by year 5" />
              <Stat num="3"     label="Platforms · 1 ecosystem" />
            </div>
          </div>
        </section>

        {/* ═══ THE THREE PLATFORMS ════════════════════════════════ */}
        <section id="platforms" className="aeris-section">
          <div className="aeris-container">
            <div style={{ marginBottom: "3rem", maxWidth: "720px" }}>
              <div className="section-eyebrow">The Three Pillars</div>
              <h2 className="aeris-h1">
                One intelligence cycle.{" "}
                <span className="green">Three platforms.</span>
              </h2>
              <p className="aeris-body" style={{ fontSize: "var(--text-lg)" }}>
                We&apos;re not building three separate apps. We&apos;re building an
                infrastructure that turns satellite data into farmer income.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <PillarCard
                icon={<Satellite size={24} />}
                name="Aeryion"
                role="Environmental Intelligence"
                body="Processes Sentinel-2 imagery, CHIRPS rainfall, and IoT weather stations. Detects drought, flood, and pest pressure 7–14 days before damage. Powers government dashboards for MAAIF, NEMA, and district offices."
                audience="Government · NGOs · Researchers"
                href={AERYION_URL}
                cta="See the dashboard"
              />
              <PillarCard
                icon={<Sprout size={24} />}
                name="Coltiva"
                role="Production Intelligence"
                body="Reaches farmers via USSD on any phone. Personalised planting calendars, fertiliser plans in bottle caps and UGX, pest alerts in plain Luo. Free for farmers — AERIS covers the call cost."
                audience="Smallholder farmers · Village agents"
                href={COLTIVA_URL}
                cta="Visit Coltiva"
              />
              <PillarCard
                icon={<Store size={24} />}
                name="LinkTrade"
                role="Market Intelligence"
                body="Secure marketplace with mobile-money escrow (MTN MoMo, Airtel Money), quality grading, and real-time price intelligence. Eliminates middleman exploitation."
                audience="Farmers · Buyers · Processors"
                href={LINKTRADE_URL}
                cta="Coming soon"
                disabled={!LINKTRADE_URL}
              />
            </div>
          </div>
        </section>

        {/* ═══ HOW THEY CONNECT ═══════════════════════════════════ */}
        <section id="how-it-works" className="aeris-section" style={{ background: "var(--bg-2)" }}>
          <div className="aeris-container">
            <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 3rem" }}>
              <div className="section-eyebrow" style={{ justifyContent: "center" }}>The Closed-Loop Cycle</div>
              <h2 className="aeris-h1">
                Detect. Decide. <span className="green">Deliver.</span>
              </h2>
              <p className="aeris-body" style={{ fontSize: "var(--text-lg)" }}>
                Every threshold breach in Lango becomes a farmer&apos;s action plan
                within hours — not seasons.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <FlowStep n="01" icon={<Radio size={20} />}
                title="Aeryion detects"
                body="Satellite NDVI drops below threshold in Lira Central. Aeryion publishes a high-severity WEATHER_ALERT event with 91% confidence." />
              <FlowStep n="02" icon={<Network size={20} />}
                title="Coltiva decides"
                body="Coltiva matches the alert to 1,200 maize farmers in affected sub-counties and generates personalised drought-mitigation advice per crop." />
              <FlowStep n="03" icon={<TrendingUp size={20} />}
                title="LinkTrade delivers"
                body="At harvest, LinkTrade matches farmers to pre-agreed buyers with mobile-money escrow — locking in price before middlemen distort the market." />
            </div>

            <div
              style={{
                marginTop: "3rem",
                padding: "1.75rem 2rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-card)",
                maxWidth: "820px",
                margin: "3rem auto 0",
              }}
            >
              <p style={{ fontSize: "var(--text-lg)", color: "var(--fg-muted)", lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: "var(--fg)" }}>
                  The $445M in post-harvest losses is not a market failure.
                </strong>{" "}
                It is an intelligence failure. AERIS exists to close it.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ PARTNER + KYC FORM ═════════════════════════════════ */}
        <section id="partner" className="aeris-section">
          <div className="aeris-container">
            <div className="partner-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "start" }}>
              <div>
                <div className="section-eyebrow">Partner with us</div>
                <h2 className="aeris-h1">
                  Build Uganda&apos;s agricultural{" "}
                  <span className="green">nervous system</span> with us.
                </h2>
                <p className="aeris-body" style={{ fontSize: "var(--text-lg)", marginBottom: "2rem" }}>
                  Whether you&apos;re an investor, a government partner, a buyer of
                  Ugandan commodities, an input supplier, or a development
                  organisation working in Northern Uganda — we want to talk.
                </p>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem", paddingLeft: 0 }}>
                  {[
                    "Investors looking at agritech in Sub-Saharan Africa",
                    "Government and ministry partners across MAAIF, NEMA, UNMA",
                    "Buyers and processors sourcing maize, sesame, sorghum, soya",
                    "Input suppliers (seeds, fertiliser, finance) targeting smallholders",
                    "Development partners working in Lango or expanding to Northern Uganda",
                  ].map((line) => (
                    <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "var(--text-md)", color: "var(--fg-muted)" }}>
                      <ShieldCheck size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "0.2rem" }} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <KycForm />
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ background: "var(--bg-footer)", borderTop: "1px solid var(--border)", padding: "3rem 0 2rem" }}>
        <div className="aeris-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <div className="aeris-wordmark" style={{ marginBottom: "0.5rem" }}>
                AERI<span>S AGRO</span>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-dim)", margin: 0, letterSpacing: "0.04em" }}>
                Intelligence. Connected.
              </p>
            </div>

            <FooterColumn
              title="Platforms"
              links={[
                { label: "Aeryion",                  href: AERYION_URL || "#",   external: !!AERYION_URL },
                { label: "Coltiva",                  href: COLTIVA_URL,           external: true },
                { label: "LinkTrade — coming soon",  href: LINKTRADE_URL || "#", external: !!LINKTRADE_URL },
              ]}
            />

            <FooterColumn
              title="Company"
              links={[
                { label: "Partner with us", href: "#partner" },
                { label: "How it works",    href: "#how-it-works" },
              ]}
            />

            <FooterColumn
              title="Contact"
              links={[
                { label: "hello@aerisagro.com",        href: "mailto:hello@aerisagro.com" },
                { label: "Kampala · Lira · Uganda",    href: "#" },
              ]}
            />
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "var(--text-sm)",
              color: "var(--fg-dim)",
            }}
          >
            <span>&copy; {new Date().getFullYear()} AERIS Agro Ltd. Built in Uganda.</span>
            <span>Lango sub-region · Lira · Alebtong · Dokolo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Local components ───────────────────────────────────────── */

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="stat-num">{num}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PillarCard({
  icon, name, role, body, audience, href, cta, disabled,
}: {
  icon: React.ReactNode; name: string; role: string;
  body: string; audience: string;
  href: string; cta: string; disabled?: boolean;
}) {
  const inner = (
    <>
      <div className="pillar-icon">{icon}</div>
      <div>
        <div className="pillar-name">{name}</div>
        <div className="pillar-role">{role}</div>
      </div>
      <p className="aeris-body" style={{ flex: 1 }}>{body}</p>
      <div
        style={{
          fontSize: "var(--text-xs)", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--fg-dim)",
        }}
      >
        For: {audience}
      </div>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          color: disabled ? "var(--fg-dim)" : "var(--accent)",
          fontWeight: 600, fontSize: "var(--text-md)",
          marginTop: "0.5rem",
        }}
      >
        {cta}
        {!disabled && <ArrowRight size={16} />}
      </div>
    </>
  );

  if (disabled) {
    return <div className="aeris-card pillar-card" aria-disabled>{inner}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="aeris-card pillar-card"
      style={{ textDecoration: "none" }}
    >
      {inner}
    </a>
  );
}

function FlowStep({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string; }) {
  return (
    <div className="aeris-card" style={{ padding: "1.75rem", position: "relative" }}>
      <div
        style={{
          position: "absolute", top: "1rem", right: "1.25rem",
          fontSize: "3.5rem", fontWeight: 800,
          color: "rgba(46,204,113,0.07)",
          lineHeight: 1, letterSpacing: "-0.04em",
        }}
        aria-hidden
      >
        {n}
      </div>

      <div
        style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: "rgba(34,128,63,0.16)",
          border: "1px solid var(--border-green)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)", marginBottom: "1rem",
        }}
      >
        {icon}
      </div>

      <h3 className="aeris-h2">{title}</h3>
      <p className="aeris-body" style={{ margin: 0 }}>{body}</p>
    </div>
  );
}

function FooterColumn({ title, links }: {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--text-xs)", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--fg)", marginBottom: "1rem",
        }}
      >
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)" }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
