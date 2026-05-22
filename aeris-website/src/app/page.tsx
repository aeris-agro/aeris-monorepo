import Link from "next/link";
import {
  Satellite,
  Sprout,
  Store,
  ArrowRight,
  TrendingUp,
  Network,
  Radio,
  ShieldCheck,
  MapPinned,
  Database,
  UsersRound,
  Landmark,
  Handshake,
  Smartphone,
  WalletCards,
} from "lucide-react";

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
          <div className="aeris-container hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">
                Agricultural intelligence for{" "}
                <span className="gold">Uganda&apos;s farmers.</span>
              </h1>

              <p className="hero-sub">
                We help farmers, local leaders, and buyers see problems early,
                make better farm decisions, and move crops to market with more
                confidence.
              </p>

              <div className="hero-actions">
                <a href="#start-here" className="aeris-btn-primary">
                  Start here <ArrowRight size={16} />
                </a>
                <a href="#partner" className="aeris-btn-ghost">
                  Start a partnership
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ═══ START HERE ════════════════════════════════════════ */}
        <section id="start-here" className="start-band">
          <div className="aeris-container">
            <div className="start-grid">
              <StartStep
                n="01"
                title="See problems early"
                body="Spot weather, crop, and local risk before farmers lose time or money."
              />
              <StartStep
                n="02"
                title="Guide farmers clearly"
                body="Turn information into simple advice that farmers can use on basic phones."
              />
              <StartStep
                n="03"
                title="Improve crop sales"
                body="Help farmers and buyers work with clearer price, quality, and payment expectations."
              />
            </div>
          </div>
        </section>

        {/* ═══ WHO IT SERVES ══════════════════════════════════════ */}
        <section id="who-it-serves" className="audience-band">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">Who it serves</div>
              <h2 className="aeris-h1">
                Clear information for{" "}
                <span className="green">the people moving agriculture forward.</span>
              </h2>
            </div>

            <div className="audience-grid">
              <AudienceCard
                icon={<Landmark size={22} />}
                title="Government and districts"
                body="Know where farmers need support before drought, pests, or poor harvests become a wider problem."
              />
              <AudienceCard
                icon={<Sprout size={22} />}
                title="Farmers and cooperatives"
                body="Get simple guidance on when to plant, what to watch for, and how to protect crops using any phone."
              />
              <AudienceCard
                icon={<Handshake size={22} />}
                title="Buyers and processors"
                body="Find reliable produce, understand quality, and trade with more trust between both sides."
              />
            </div>
            <SectionCta href="/?interest=cooperative_onboarding#partner" label="Support farmers with AERIS" />
          </div>
        </section>

        {/* ═══ THE THREE PLATFORMS ════════════════════════════════ */}
        <section id="platforms" className="aeris-section">
          <div className="aeris-container">
            <div className="section-intro">
              <div className="section-eyebrow">What we provide</div>
              <h2 className="aeris-h1">
                Three simple tools.{" "}
                <span className="green">One connected service.</span>
              </h2>
              <p className="aeris-body section-lede">
                AERIS helps people understand what is happening, decide what to
                do next, and connect harvests to better market opportunities.
              </p>
            </div>

            <div className="platform-grid">
              <PillarCard
                icon={<Satellite size={24} />}
                name="Aeryion"
                role="Early warning"
                status="In pilot"
                bullets={[
                  "Shows where weather or crop risk is rising",
                  "Helps districts and partners focus support",
                  "Turns field conditions into clear alerts",
                ]}
                audience="Government · NGOs · Researchers"
                href={AERYION_URL}
                cta="View Aeryion"
              />
              <PillarCard
                icon={<Sprout size={24} />}
                name="Coltiva"
                role="Farmer guidance"
                status="Live access"
                bullets={[
                  "Works on basic phones",
                  "Gives planting, input, and pest guidance",
                  "Uses plain language farmers can act on",
                ]}
                audience="Smallholder farmers · Village agents"
                href={COLTIVA_URL}
                cta="Visit Coltiva"
              />
              <PillarCard
                icon={<Store size={24} />}
                name="LinkTrade"
                role="Market connection"
                status="Coming soon"
                bullets={[
                  "Connects farmers with serious buyers",
                  "Supports price and quality clarity",
                  "Designed for safer payment steps",
                ]}
                audience="Farmers · Buyers · Processors"
                href={LINKTRADE_URL}
                cta="Coming soon"
                disabled={!LINKTRADE_URL}
              />
            </div>
            <SectionCta href="#how-it-works" label="See how it helps" />
          </div>
        </section>

        {/* ═══ HOW THEY CONNECT ═══════════════════════════════════ */}
        <section id="how-it-works" className="aeris-section section-alt">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">How it helps</div>
              <h2 className="aeris-h1">
                See the risk. Share the advice.{" "}
                <span className="green">Improve the sale.</span>
              </h2>
              <p className="aeris-body section-lede">
                AERIS turns scattered information into simple next steps for
                the people who need to act.
              </p>
            </div>

            <div className="flow-grid">
              <FlowStep n="01" icon={<Radio size={20} />}
                title="AERIS spots a problem"
                body="Weather, crop, or local field conditions show that farmers in an area may need attention." />
              <FlowStep n="02" icon={<Network size={20} />}
                title="Farmers get useful guidance"
                body="Advice is turned into clear actions, such as when to plant, what to check, or how to respond." />
              <FlowStep n="03" icon={<TrendingUp size={20} />}
                title="Markets become easier to trust"
                body="At harvest, better information helps farmers and buyers agree on quality, price, and payment." />
            </div>

            <div className="insight-card">
              <p>
                <strong>
                  Agricultural losses are not only a market failure.
                </strong>{" "}
                They often happen because the right information reaches people
                too late. AERIS is built to change that.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ TRUST PROOF ════════════════════════════════════════ */}
        <section id="field" className="proof-band" aria-labelledby="proof-heading">
          <div className="aeris-container">
            <div className="proof-header">
              <div>
                <div className="section-eyebrow">Grounded in the field</div>
                <h2 id="proof-heading" className="aeris-h1">
                  Built for how farming and trade{" "}
                  <span className="green">actually work.</span>
                </h2>
              </div>
              <p className="aeris-body">
                AERIS is shaped around basic phones, district operations,
                changing weather, farmer groups, and crop buyers who need
                dependable information before decisions are made.
              </p>
            </div>

            <div className="proof-grid">
              <ProofCard
                icon={<MapPinned size={20} />}
                label="Where we start"
                title="Lango sub-region"
                body="Our first focus is Lira, Alebtong, Dokolo, and nearby farming communities in Northern Uganda."
              />
              <ProofCard
                icon={<Database size={20} />}
                label="What we watch"
                title="Weather, crops, and risk"
                body="We track the conditions that affect planting, crop health, harvest timing, and local response."
              />
              <ProofCard
                icon={<UsersRound size={20} />}
                label="Who uses it"
                title="Farmers, leaders, and buyers"
                body="The same information flow helps people on the farm, in district offices, and in the market."
              />
              <ProofCard
                icon={<ShieldCheck size={20} />}
                label="How trade improves"
                title="Safer crop transactions"
                body="The market side is designed to support clearer prices, quality checks, and safer payment steps."
              />
            </div>
          </div>
        </section>

        {/* ═══ WHY NOW ════════════════════════════════════════════ */}
        <section className="aeris-section why-now-section">
          <div className="aeris-container">
            <div className="section-intro">
              <div className="section-eyebrow">Why now</div>
              <h2 className="aeris-h1">
                The right tools can now reach{" "}
                <span className="green">the right people.</span>
              </h2>
            </div>

            <div className="why-grid">
              <ProofCard
                icon={<Satellite size={20} />}
                label="Earlier warning"
                title="Problems can be seen sooner"
                body="Weather and crop changes can be noticed before farmers lose a season of work."
              />
              <ProofCard
                icon={<Smartphone size={20} />}
                label="Wider reach"
                title="Basic phones still work"
                body="Farmers should not need a smartphone or data bundle to receive useful advice."
              />
              <ProofCard
                icon={<WalletCards size={20} />}
                label="Better trade"
                title="Payments can be safer"
                body="Mobile money makes it possible to build more trust into crop transactions."
              />
            </div>
          </div>
        </section>

        {/* ═══ CHOOSE PATH ════════════════════════════════════════ */}
        <section id="choose-path" className="aeris-section choose-path-section">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">Choose your path</div>
              <h2 className="aeris-h1">
                Tell us what you want{" "}
                <span className="green">to build or solve.</span>
              </h2>
            </div>

            <div className="path-grid">
              <PathCard
                title="I support farmers"
                body="For cooperatives, NGOs, input providers, and farmer programs."
                href="/?interest=cooperative_onboarding#partner"
              />
              <PathCard
                title="I represent a district or public team"
                body="For public-sector teams planning farmer support or local programs."
                href="/?interest=government_deployment#partner"
              />
              <PathCard
                title="I buy or process crops"
                body="For buyers and processors looking for clearer supply and quality."
                href="/?interest=commodity_sourcing#partner"
              />
              <PathCard
                title="I want to invest or partner"
                body="For investors, research teams, and strategic partners."
                href="/?interest=investment#partner"
              />
            </div>
          </div>
        </section>

        {/* ═══ PARTNER + KYC FORM ═════════════════════════════════ */}
        <section id="partner" className="aeris-section">
          <div className="aeris-container">
            <div className="partner-grid">
              <div className="partner-intro">
                <div className="section-eyebrow">Partner with us</div>
                <h2 className="aeris-h1">
                  Tell us what you want{" "}
                  <span className="green">to build or solve.</span>
                </h2>
                <p className="aeris-body partner-lede">
                  We work with investors, public-sector teams, buyers,
                  cooperatives, input suppliers, and development partners who
                  want clearer agricultural information in Northern Uganda.
                </p>
              </div>

              <KycForm />

              <ul className="partner-bullets">
                {[
                  "Support farmers before drought, pests, or poor timing reduce yields",
                  "Plan local programs with clearer information from the field",
                  "Source crops with better visibility on quality and supply",
                  "Reach smallholder farmers with useful inputs, finance, or advice",
                  "Start in Lango and expand across Northern Uganda",
                ].map((line) => (
                  <li key={line}>
                    <ShieldCheck size={18} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="aeris-container">
          <div className="footer-grid">
            <div>
              <div className="aeris-wordmark footer-wordmark">
                AERI<span>S AGRO</span>
              </div>
              <p className="footer-tagline">Intelligence. Connected.</p>
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
              title="Explore"
              links={[
                { label: "Start here",       href: "#start-here" },
                { label: "Who it serves",    href: "#who-it-serves" },
                { label: "What we offer",    href: "#platforms" },
                { label: "How it helps",     href: "#how-it-works" },
                { label: "Grounded field",   href: "#field" },
                { label: "Choose your path", href: "#choose-path" },
                { label: "FAQ",              href: "/faq" },
                { label: "Privacy Policy",   href: "/privacy" },
              ]}
            />

            <FooterColumn
              title="Contact"
              links={[
                { label: "aerisagro@gmail.com",        href: "mailto:aerisagro@gmail.com" },
                { label: "Kampala · Lira · Uganda" },
              ]}
            />
          </div>

          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} AERIS Agro Ltd. Built in Uganda.</span>
            <span>Lango sub-region · Lira · Alebtong · Dokolo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Local components ───────────────────────────────────────── */

function ProofCard({
  icon, label, title, body,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="proof-card">
      <div className="proof-icon">{icon}</div>
      <div>
        <div className="proof-label">{label}</div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

function AudienceCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="audience-card">
      <div className="audience-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function StartStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="start-step">
      <div>{n}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function SectionCta({ href, label }: { href: string; label: string }) {
  const inner = (
    <>
      {label} <ArrowRight size={16} />
    </>
  );

  return (
    <div className="section-cta">
      {href.startsWith("/") ? (
        <Link href={href} className="aeris-btn-ghost">{inner}</Link>
      ) : (
        <a href={href} className="aeris-btn-ghost">{inner}</a>
      )}
    </div>
  );
}

function PathCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link className="path-card" href={href}>
      <h3>{title}</h3>
      <p>{body}</p>
      <span>Continue <ArrowRight size={16} /></span>
    </Link>
  );
}

function PillarCard({
  icon, name, role, status, bullets, audience, href, cta, disabled,
}: {
  icon: React.ReactNode; name: string; role: string;
  status: string; bullets: string[]; audience: string;
  href: string; cta: string; disabled?: boolean;
}) {
  const inner = (
    <>
      <div className="pillar-icon">{icon}</div>
      <div>
        <div className="pillar-name">{name}</div>
        <div className="pillar-role">{role}</div>
      </div>
      <div className="pillar-status">{status}</div>
      <ul className="pillar-bullets">
        {bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="pillar-audience">
        For: {audience}
      </div>
      <div className={`pillar-cta ${disabled ? "is-disabled" : ""}`}>
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
    >
      {inner}
    </a>
  );
}

function FlowStep({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string; }) {
  return (
    <div className="aeris-card flow-step">
      <div className="flow-step-num" aria-hidden>
        {n}
      </div>

      <div className="flow-step-icon">
        {icon}
      </div>

      <h3 className="aeris-h2">{title}</h3>
      <p className="aeris-body flow-step-body">{body}</p>
    </div>
  );
}

function FooterColumn({ title, links }: {
  title: string;
  links: Array<{ label: string; href?: string; external?: boolean }>;
}) {
  return (
    <div className="footer-column">
      <div className="footer-column-title">
        {title}
      </div>
      <ul className="footer-column-list">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink {...l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ label, href, external }: { label: string; href?: string; external?: boolean }) {
  if (!href) {
    return <span>{label}</span>;
  }

  if (external || href.startsWith("mailto:") || href.startsWith("#")) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>
    );
  }

  return <Link href={href}>{label}</Link>;
}
