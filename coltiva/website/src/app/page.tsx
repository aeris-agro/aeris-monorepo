import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { PhoneMockup } from "@/components/PhoneMockup";

export default function LandingPage() {
  return (
    <>
      <SiteNav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight:   "calc(100vh - 68px)",
          display:     "flex",
          alignItems:  "center",
          padding:     "5rem 0 4rem",
          background:  "linear-gradient(160deg, var(--bg) 50%, #e8f5eb 100%)",
          position:    "relative",
          overflow:    "hidden",
        }}
      >
        {/* Soft texture */}
        <div
          style={{
            position:        "absolute",
            inset:           0,
            pointerEvents:   "none",
            backgroundImage: "radial-gradient(rgba(34,128,63,0.06) 1px, transparent 1px)",
            backgroundSize:  "32px 32px",
          }}
        />
        {/* Decorative blob */}
        <div
          style={{
            position:      "absolute",
            width:         "500px",
            height:        "500px",
            borderRadius:  "50%",
            background:    "radial-gradient(circle, rgba(46,204,113,0.10) 0%, transparent 70%)",
            top:           "-120px",
            right:         "-100px",
            pointerEvents: "none",
          }}
        />

        <div
          className="aeris-container"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="hero-grid">
            {/* Left — copy */}
            <div>
              <div
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            "0.5rem",
                  background:     "var(--tag-bg)",
                  border:         "1px solid var(--tag-border)",
                  borderRadius:   "100px",
                  padding:        "0.4rem 1rem",
                  marginBottom:   "1.75rem",
                }}
              >
                <span
                  style={{
                    width:         "7px",
                    height:        "7px",
                    borderRadius:  "50%",
                    background:    "var(--accent)",
                    animation:     "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily:     "var(--font-primary)",
                    fontSize:       "var(--text-xs)",
                    fontWeight:     700,
                    color:          "var(--tag-color)",
                    letterSpacing:  "0.12em",
                    textTransform:  "uppercase",
                  }}
                >
                  Now live · Lango sub-region
                </span>
              </div>

              <h1
                className="aeris-hero-title"
                style={{ color: "var(--fg)", marginBottom: "1.5rem" }}
              >
                Smart farming on{" "}
                <span style={{ color: "var(--accent)" }}>any phone.</span>
                <br />
                <span style={{ color: "var(--aeris-gold)" }}>Free for farmers.</span>
              </h1>

              <p
                className="aeris-body"
                style={{
                  fontSize:     "var(--text-xl)",
                  maxWidth:     "520px",
                  marginBottom: "2rem",
                }}
              >
                Coltiva delivers personalised crop advice, weather alerts, soil
                recommendations, and market prices — to any phone via{" "}
                <strong style={{ color: "var(--fg)" }}>*217#</strong>. No internet.
                No smartphone. No cost to the farmer.
              </p>

              <div
                style={{
                  display:    "flex",
                  gap:        "0.875rem",
                  flexWrap:   "wrap",
                }}
              >
                <Link href="/signup" className="aeris-btn-primary">
                  Create your free account
                </Link>
                <a href="#how-it-works" className="aeris-btn-ghost">
                  See how it works
                </a>
              </div>

              <div
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "1.5rem",
                  marginTop:   "2.25rem",
                  flexWrap:    "wrap",
                }}
              >
                {[
                  // "6 crops covered",
                  // "Satellite-powered",
                  // "Always free for farmers",
                ].map((label) => (
                  <span
                    key={label}
                    style={{
                      fontSize:     "var(--text-sm)",
                      fontWeight:   500,
                      color:        "var(--fg-muted)",
                      display:      "inline-flex",
                      alignItems:   "center",
                      gap:          "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        width:        "6px",
                        height:       "6px",
                        borderRadius: "50%",
                        background:   "var(--accent)",
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — phone mockup */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      {/* <section
        className="theme-dark"
        style={{
          background:  "#0a1f10",
          borderTop:   "4px solid var(--accent)",
          padding:     "3rem 0",
          color:       "#fff",
        }}
      >
        <div className="aeris-container">
          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap:                 "1px",
              background:          "rgba(255,255,255,0.06)",
              borderRadius:        "var(--radius-card)",
              overflow:            "hidden",
            }}
          >
            {[
              ["120,000+", "Target farmers"],
              ["3",        "Districts in Lango"],
              ["UGX 0",    "Cost to farmers"],
              ["72 hrs",   "Advance weather alerts"],
            ].map(([num, label]) => (
              <div
                key={label}
                style={{
                  padding:    "2rem 1.5rem",
                  textAlign:  "center",
                  background: "#0a1f10",
                }}
              >
                <div
                  style={{
                    fontSize:      "var(--text-4xl)",
                    fontWeight:    800,
                    color:         "var(--aeris-green-bright)",
                    letterSpacing: "-0.02em",
                    marginBottom:  "0.4rem",
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    fontSize:       "var(--text-xs)",
                    fontWeight:     700,
                    letterSpacing:  "0.1em",
                    textTransform:  "uppercase",
                    color:          "rgba(255,255,255,0.5)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="aeris-section">
        <div className="aeris-container">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="aeris-h1" style={{ marginBottom: "3rem", maxWidth: "640px" }}>
            Three steps. <span style={{ color: "var(--accent)" }}>One minute.</span>
          </h2>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap:                 "1.5rem",
            }}
          >
            <StepCard
              n="01"
              title="Dial *217#"
              body="From any phone, on any network. No internet. No app. No smartphone needed. The service is completely free for farmers — Coltiva covers the call cost."
            />
            <StepCard
              n="02"
              title="Tell us about your farm"
              body="Select your crop, your district, and the question you have. Coltiva takes 60 seconds to gather what it needs to give you specific advice."
            />
            <StepCard
              n="03"
              title="Get your farm report"
              body="A personalised report by SMS: 7-day forecast, fertiliser amounts in bottle caps and UGX, current market price, and pest alerts. In plain language."
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section
        id="features"
        className="aeris-section"
        style={{ background: "var(--bg-2)" }}
      >
        <div className="aeris-container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <SectionEyebrow centered>Features</SectionEyebrow>
            <h2 className="aeris-h1">
              Everything your farm needs.{" "}
              <span style={{ color: "var(--accent)" }}>Nothing it doesn&apos;t.</span>
            </h2>
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap:                 "1.25rem",
            }}
          >
            <FeatureCard
              tag="Weather"
              title="72-hour weather alerts"
              body="Drought risk, flood warnings, and planting-window alerts before damage occurs. Powered by data from Aeryion (our environmental monitoring tool), refreshed every 5 days across Lango."
            />
            <FeatureCard
              tag="Soil"
              title="Soil-specific fertiliser plans"
              body="How much fertiliser your soil actually needs — in bottle caps and UGX, not kilograms per hectare. Calibrated to Lango's soil profile, not generic advice."
            />
            <FeatureCard
              tag="Markets"
              title="Live market prices"
              body="Maize, sesame, sorghum, soya, sunflower, and cassava prices in Lira, Alebtong, and Dokolo markets. Know what your produce is worth before a trader arrives."
            />
            <FeatureCard
              tag="Alerts"
              title="Pest & disease warnings"
              body="Fall Armyworm outbreaks, Cassava Mosaic Disease risk, and pest pressure alerts specific to your sub-county. Know before you see the first symptom."
            />
          </div>
        </div>
      </section>

      {/* ── FARMER STORIES ───────────────────────────────────────────── */}
      {/* <section id="impact" className="aeris-section">
        <div className="aeris-container">
          <SectionEyebrow>Farmer stories</SectionEyebrow>
          <h2 className="aeris-h1" style={{ marginBottom: "3rem", maxWidth: "640px" }}>
            Numbers that matter to{" "}
            <span style={{ color: "var(--accent)" }}>real farmers.</span>
          </h2>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap:                 "1.25rem",
            }}
          >
            <StoryCard
              quote="Coltiva told me to wait six days before planting. I waited. The rains came perfectly. My harvest was the best in five years."
              before="−30%"  beforeLabel="Drought loss"     beforeColor="#c0392b"
              after="+22%"   afterLabel="Yield gain"        afterColor="var(--accent)"
              name="Okello James"
              role="Maize farmer · Lira"
            />
            <StoryCard
              quote="A trader offered UGX 400 per kg. The market price was UGX 650. I earned UGX 780,000 more that season."
              before="UGX 400" beforeLabel="Trader offer/kg"
              after="UGX 650"  afterLabel="Market price/kg"
              beforeColor="#c0392b" afterColor="var(--accent)"
              name="Akello Grace"
              role="Sesame farmer · Alebtong"
            />
            <StoryCard
              quote="Coltiva said my soil already had enough potassium. I saved UGX 165,000 on fertiliser I didn't need — same yield."
              before="UGX 180K" beforeLabel="Generic plan cost"
              after="UGX 15K"   afterLabel="What I needed"
              beforeColor="#c0392b" afterColor="var(--accent)"
              name="Adeke Ruth"
              role="Soybean farmer · Dokolo"
            />
          </div>
        </div>
      </section> */}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section
        className="theme-dark aeris-section"
        style={{
          background:    "linear-gradient(145deg, #0a1f10, #0d2a15)",
          color:         "#fff",
          textAlign:     "center",
          position:      "relative",
          overflow:      "hidden",
        }}
      >
        <div
          style={{
            position:      "absolute",
            width:         "600px",
            height:        "600px",
            borderRadius:  "50%",
            background:    "radial-gradient(circle, rgba(46,204,113,0.15) 0%, transparent 65%)",
            left:          "50%",
            top:           "50%",
            transform:     "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="aeris-container"
          style={{ position: "relative", zIndex: 2, maxWidth: "640px" }}
        >
          <h2
            className="aeris-h1"
            style={{ color: "#fff", marginBottom: "1rem" }}
          >
            Your farm deserves{" "}
            <span style={{ color: "var(--aeris-green-bright)" }}>better information.</span>
          </h2>
          <p
            className="aeris-body"
            style={{
              color:    "rgba(255,255,255,0.7)",
              fontSize: "var(--text-lg)",
              maxWidth: "480px",
              margin:   "0 auto 2.25rem",
            }}
          >
            Join Lango farmers getting reliable information on weather
            and fair market prices — completely free.sss
          </p>
          <Link href="/signup" className="aeris-btn-primary">
            Create your free account
          </Link>
          <div
            style={{
              marginTop:     "1.25rem",
              fontSize:      "var(--text-sm)",
              color:         "rgba(255,255,255,0.5)",
              letterSpacing: "0.04em",
            }}
          >
            Or dial *217# from any phone — no signup needed
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--bg-footer)",
          borderTop:  "1px solid var(--border)",
          padding:    "2rem 0",
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
          <p
            style={{
              fontSize: "var(--text-sm)",
              color:    "var(--fg-dim)",
              margin:   0,
            }}
          >
            Part of <strong style={{ color: "var(--fg)" }}>AERIS AGRO</strong> · Built in Uganda
          </p>
        </div>
      </footer>
    </>
  );
}

/* ── Local components ───────────────────────────────────────────────── */

function SectionEyebrow({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: centered ? "center" : "flex-start",
        gap:            "0.625rem",
        marginBottom:   "0.875rem",
        fontSize:       "var(--text-xs)",
        fontWeight:     700,
        letterSpacing:  "0.16em",
        textTransform:  "uppercase",
        color:          "var(--accent-dim)",
      }}
    >
      <span
        style={{
          display:    "inline-block",
          width:      "28px",
          height:     "1.5px",
          background: "var(--accent)",
        }}
      />
      {children}
      {centered && (
        <span
          style={{
            display:    "inline-block",
            width:      "28px",
            height:     "1.5px",
            background: "var(--accent)",
          }}
        />
      )}
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div
      className="aeris-card"
      style={{ padding: "2rem", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position:      "absolute",
          top:           "1rem",
          right:         "1.25rem",
          fontSize:      "4rem",
          fontWeight:    800,
          color:         "rgba(34,128,63,0.05)",
          lineHeight:    1,
          letterSpacing: "-0.04em",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize:      "var(--text-xs)",
          fontWeight:    700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color:         "var(--accent)",
          marginBottom:  "0.75rem",
        }}
      >
        Step {n}
      </div>
      <h3
        style={{
          fontSize:    "var(--text-xl)",
          fontWeight:  700,
          color:       "var(--fg)",
          margin:      "0 0 0.625rem",
          lineHeight:  1.25,
        }}
      >
        {title}
      </h3>
      <p className="aeris-body" style={{ margin: 0, fontSize: "var(--text-md)" }}>
        {body}
      </p>
    </div>
  );
}

function FeatureCard({
  tag,
  title,
  body,
}: {
  tag:   string;
  title: string;
  body:  string;
}) {
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
          fontSize:    "var(--text-xl)",
          fontWeight:  700,
          color:       "var(--fg)",
          margin:      "0 0 0.625rem",
          lineHeight:  1.25,
        }}
      >
        {title}
      </h3>
      <p className="aeris-body" style={{ margin: 0, fontSize: "var(--text-md)" }}>
        {body}
      </p>
    </div>
  );
}

function StoryCard({
  quote,
  before,
  beforeLabel,
  beforeColor,
  after,
  afterLabel,
  afterColor,
  name,
  role,
}: {
  quote:        string;
  before:       string;
  beforeLabel:  string;
  beforeColor:  string;
  after:        string;
  afterLabel:   string;
  afterColor:   string;
  name:         string;
  role:         string;
}) {
  return (
    <div className="aeris-card" style={{ padding: "1.75rem" }}>
      <p
        style={{
          fontSize:    "var(--text-md)",
          fontStyle:   "italic",
          color:       "var(--fg)",
          lineHeight:  1.7,
          margin:      "0 0 1.25rem",
        }}
      >
        “{quote}”
      </p>

      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1.125rem" }}>
        <div
          style={{
            flex:         1,
            background:   "rgba(192,57,43,0.06)",
            border:       "1px solid rgba(192,57,43,0.18)",
            borderRadius: "var(--radius-sm)",
            padding:      "0.75rem",
            textAlign:    "center",
          }}
        >
          <div
            style={{
              fontSize:       "var(--text-xs)",
              fontWeight:     700,
              letterSpacing:  "0.08em",
              color:          beforeColor,
              marginBottom:   "0.25rem",
            }}
          >
            BEFORE
          </div>
          <div
            style={{
              fontSize:    "var(--text-2xl)",
              fontWeight:  800,
              color:       beforeColor,
              lineHeight:  1.1,
            }}
          >
            {before}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-dim)", marginTop: "0.25rem" }}>
            {beforeLabel}
          </div>
        </div>
        <div
          style={{
            flex:         1,
            background:   "rgba(34,128,63,0.06)",
            border:       "1px solid rgba(34,128,63,0.20)",
            borderRadius: "var(--radius-sm)",
            padding:      "0.75rem",
            textAlign:    "center",
          }}
        >
          <div
            style={{
              fontSize:       "var(--text-xs)",
              fontWeight:     700,
              letterSpacing:  "0.08em",
              color:          afterColor,
              marginBottom:   "0.25rem",
            }}
          >
            AFTER
          </div>
          <div
            style={{
              fontSize:    "var(--text-2xl)",
              fontWeight:  800,
              color:       afterColor,
              lineHeight:  1.1,
            }}
          >
            {after}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-dim)", marginTop: "0.25rem" }}>
            {afterLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize:    "var(--text-md)",
          fontWeight:  700,
          color:       "var(--fg)",
          marginBottom: "0.125rem",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize:       "var(--text-xs)",
          letterSpacing:  "0.08em",
          textTransform:  "uppercase",
          color:          "var(--fg-dim)",
        }}
      >
        {role}
      </div>
    </div>
  );
}
