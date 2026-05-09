import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export default function LandingPage() {
  return (
    <>
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="aeris-section" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="aeris-container">
          <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
            <span className="aeris-tag" style={{ marginBottom: "1.5rem" }}>
              Built for Lango sub-region
            </span>
            <h1 className="aeris-hero-title" style={{ marginBottom: "1.5rem" }}>
              Agricultural intelligence{" "}
              <span style={{ color: "var(--accent)" }}>in your pocket.</span>
            </h1>
            <p
              className="aeris-body"
              style={{ fontSize: "var(--text-xl)", maxWidth: "640px", margin: "0 auto 2.5rem" }}
            >
              Coltiva connects smallholder farmers and cooperatives to weather forecasts,
              soil insights, and market signals. Delivered by SMS, USSD, and a simple
              dashboard your team can actually use.
            </p>
            <div
              style={{
                display:        "flex",
                gap:            "0.75rem",
                justifyContent: "center",
                flexWrap:       "wrap",
              }}
            >
              <Link href="/signup" className="aeris-btn-primary">
                Create your account
              </Link>
              <Link href="/login" className="aeris-btn-ghost">
                I already have one
              </Link>
            </div>
            <p
              style={{
                marginTop:  "1.25rem",
                fontSize:   "var(--text-sm)",
                color:      "var(--fg-dim)",
              }}
            >
              No email required. We sign you in with your phone number.
            </p>
          </div>
        </div>
      </section>

      {/* ── Value props ──────────────────────────────────────────────── */}
      <section className="aeris-section" style={{ background: "var(--bg-2)" }}>
        <div className="aeris-container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="aeris-tag" style={{ marginBottom: "1rem" }}>
              What you get
            </span>
            <h2 className="aeris-h1">Everything a cooperative needs to support its farmers.</h2>
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap:                 "1.5rem",
            }}
          >
            <FeatureCard
              tag="Weather"
              title="7-day rainfall forecasts"
              body="LSTM-based forecasts for every sub-county, refreshed daily, delivered before the dawn radio bulletin."
            />
            <FeatureCard
              tag="Soil"
              title="Soil health, plot by plot"
              body="iSDAsoil + Sentinel-2 readings tell each farmer when to apply nitrogen and how their fields are recovering."
            />
            <FeatureCard
              tag="Markets"
              title="Live commodity prices"
              body="Maize, sorghum, and bean prices from regional markets — so farmers and cooperatives can negotiate confidently."
            />
            <FeatureCard
              tag="Alerts"
              title="Drought and pest warnings"
              body="When NDVI drops or rainfall lags, your members get an SMS in English or Luo before the damage is done."
            />
            <FeatureCard
              tag="Dashboard"
              title="One view of every member"
              body="Cooperative admins see every farmer, every plot, every advisory sent — without spreadsheets."
            />
            <FeatureCard
              tag="USSD"
              title="Works on any phone"
              body="Smartphone or feature phone, network or no network. Coltiva meets farmers where they are."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="aeris-section">
        <div className="aeris-container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="aeris-tag" style={{ marginBottom: "1rem" }}>
              How it works
            </span>
            <h2 className="aeris-h1">Three steps. No paperwork.</h2>
          </div>
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap:                 "1.5rem",
              maxWidth:            "960px",
              margin:              "0 auto",
            }}
          >
            <StepCard n="01" title="Enter your phone" body="We send you a 6-digit code by SMS." />
            <StepCard n="02" title="Verify the code" body="Type it in. That's your account." />
            <StepCard
              n="03"
              title="Open your dashboard"
              body="Add farmers, plots, and start receiving advisories."
            />
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────── */}
      <section
        className="aeris-section theme-dark"
        style={{
          background:    "var(--cta-bg, linear-gradient(135deg,#0a2010,#0d2a15,#0a1f10))",
          borderTop:     "1px solid var(--cta-border)",
          borderBottom:  "1px solid var(--cta-border)",
          color:         "#fff",
        }}
      >
        <div className="aeris-container" style={{ textAlign: "center" }}>
          <h2 className="aeris-h1" style={{ color: "#fff", marginBottom: "1rem" }}>
            Join cooperatives building Uganda&apos;s food future.
          </h2>
          <p
            className="aeris-body"
            style={{
              color:    "rgba(255,255,255,0.75)",
              maxWidth: "560px",
              margin:   "0 auto 2rem",
              fontSize: "var(--text-lg)",
            }}
          >
            Sign up takes under a minute. No payment required to start.
          </p>
          <Link href="/signup" className="aeris-btn-primary">
            Create your account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        style={{
          background:   "var(--bg-footer)",
          borderTop:    "1px solid var(--border)",
          padding:      "2rem 0",
        }}
      >
        <div
          className="aeris-container"
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            flexWrap:       "wrap",
            gap:            "1rem",
          }}
        >
          <div className="coltiva-logo">
            <span className="coltiva-logo-mark">C</span>
            <span className="coltiva-logo-text">Coltiva</span>
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-dim)", margin: 0 }}>
            Part of <strong style={{ color: "var(--fg)" }}>AERIS Group</strong> · Built in
            Uganda
          </p>
        </div>
      </footer>
    </>
  );
}

// ── Local components ───────────────────────────────────────────────────────
function FeatureCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="aeris-card" style={{ padding: "1.75rem" }}>
      <span
        className="aeris-tag"
        style={{ marginBottom: "1rem", display: "inline-flex" }}
      >
        {tag}
      </span>
      <h3
        style={{
          fontSize:   "var(--text-xl)",
          fontWeight: 700,
          color:      "var(--fg)",
          margin:     "0 0 0.5rem",
        }}
      >
        {title}
      </h3>
      <p
        className="aeris-body"
        style={{ margin: 0, fontSize: "var(--text-md)" }}
      >
        {body}
      </p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="aeris-card" style={{ padding: "1.75rem", textAlign: "center" }}>
      <div
        style={{
          fontSize:   "var(--text-2xl)",
          fontWeight: 800,
          color:      "var(--accent)",
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </div>
      <h3
        style={{
          fontSize:   "var(--text-xl)",
          fontWeight: 700,
          color:      "var(--fg)",
          margin:     "0 0 0.5rem",
        }}
      >
        {title}
      </h3>
      <p className="aeris-body" style={{ margin: 0 }}>{body}</p>
    </div>
  );
}
