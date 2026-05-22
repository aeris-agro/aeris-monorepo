import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  Handshake,
  Landmark,
  MapPinned,
  Satellite,
  ShieldCheck,
  Smartphone,
  Sprout,
  Store,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { SiteNav } from "@/components/SiteNav";

const COLTIVA_URL = process.env.NEXT_PUBLIC_COLTIVA_WEBSITE_URL ?? "https://coltiva-website.vercel.app";
const AERYION_URL = process.env.NEXT_PUBLIC_AERYION_DASHBOARD_URL ?? "";
const LINKTRADE_URL = process.env.NEXT_PUBLIC_LINKTRADE_URL ?? "";

const AERYION_HREF = AERYION_URL || "/partner?interest=data_research";
const COLTIVA_HREF = COLTIVA_URL || "/partner?interest=cooperative_onboarding";
const LINKTRADE_HREF = LINKTRADE_URL || "/partner?interest=commodity_sourcing";

const PLATFORM_CARDS = [
  {
    icon: <Satellite size={24} />,
    name: "Aeryion",
    role: "Early warning",
    status: "Pilot-ready",
    bgImage: "/images/aeris-product-suite.png",
    bullets: [
      "Shows where weather or crop risk is rising.",
      "Helps teams focus support before losses spread.",
      "Turns field signals into clear next steps.",
    ],
    audience: "Government teams · NGOs · researchers",
    href: AERYION_HREF,
    cta: AERYION_URL ? "Open Aeryion" : "Discuss Aeryion",
  },
  {
    icon: <Sprout size={24} />,
    name: "Coltiva",
    role: "Farmer guidance",
    status: "Live access",
    bgImage: "/images/aeris-hero-field.png",
    bullets: [
      "Works on basic phones.",
      "Shares simple advice farmers can act on immediately.",
      "Helps with planting, input use, and pest response.",
    ],
    audience: "Farmers · cooperatives · extension agents",
    href: COLTIVA_HREF,
    cta: COLTIVA_URL ? "Visit Coltiva" : "Discuss Coltiva",
  },
  {
    icon: <Store size={24} />,
    name: "LinkTrade",
    role: "Market connection",
    status: "In build",
    bgImage: "/images/aeris-og.png",
    bullets: [
      "Connects farmers with serious buyers.",
      "Helps both sides agree on quality and timing.",
      "Supports safer steps between offer and payment.",
    ],
    audience: "Farmers · buyers · processors",
    href: LINKTRADE_HREF,
    cta: LINKTRADE_URL ? "Open LinkTrade" : "Discuss LinkTrade",
  },
] as const;

const AUDIENCE_CARDS = [
  {
    icon: <Landmark size={22} />,
    title: "Government and districts",
    body: "See where farmers need support early, so local teams can respond before a small issue becomes a larger one.",
  },
  {
    icon: <Sprout size={22} />,
    title: "Farmers and cooperatives",
    body: "Get plain guidance on when to act, what to watch for, and how to protect crop value using the phone you already have.",
  },
  {
    icon: <Handshake size={22} />,
    title: "Buyers and processors",
    body: "Understand supply, quality, and timing earlier so buying decisions are clearer and easier to trust.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    title: "See the issue sooner",
    body: "AERIS watches the conditions that affect crops and turns them into a readable signal, not a wall of technical data.",
  },
  {
    title: "Send the right guidance",
    body: "Farmer-facing advice stays short, practical, and easy to follow on a basic phone or through a local agent.",
  },
  {
    title: "Match supply to demand",
    body: "Market tools help buyers and growers understand what is available and how to move it with more confidence.",
  },
  {
    title: "Keep the loop moving",
    body: "District teams, farmer groups, and buyers can act from the same picture instead of working from separate guesses.",
  },
] as const;

const FIELD_CARDS = [
  {
    icon: <MapPinned size={20} />,
    label: "Where we begin",
    title: "Lango sub-region",
    body: "Our first focus is Lira, Alebtong, Dokolo, and nearby farming communities in Northern Uganda.",
  },
  {
    icon: <Smartphone size={20} />,
    label: "How it reaches people",
    title: "Basic phones first",
    body: "The experience is designed so useful information can still travel without a smartphone or data bundle.",
  },
  {
    icon: <UsersRound size={20} />,
    label: "Who uses the same picture",
    title: "Field, district, and market teams",
    body: "The same core information can help farmers, local leaders, and buyers make decisions from the same source.",
  },
  {
    icon: <ShieldCheck size={20} />,
    label: "What trade gets",
    title: "Clearer, safer transactions",
    body: "The market side is shaped around clearer expectations, simpler steps, and more trust between both sides.",
  },
] as const;

const WHY_NOW = [
  {
    icon: <Satellite size={20} />,
    label: "Earlier warning",
    title: "Problems can be spotted earlier",
    body: "Weather and crop changes can be noticed before they wipe out a season of work.",
  },
  {
    icon: <Smartphone size={20} />,
    label: "Wider reach",
    title: "Useful advice can reach more people",
    body: "Basic phones are enough when the message is short and the route is simple.",
  },
  {
    icon: <WalletCards size={20} />,
    label: "Safer trade",
    title: "Payments can be handled more carefully",
    body: "Mobile money makes it possible to build better safeguards into crop transactions.",
  },
] as const;

const PATHS = [
  {
    title: "I support farmers",
    body: "For cooperatives, NGOs, input providers, and field programs that need a clearer way to support farmers.",
    href: "/partner?interest=cooperative_onboarding",
  },
  {
    title: "I represent a district or public team",
    body: "For teams planning local support, program delivery, or earlier response to crop risk.",
    href: "/partner?interest=government_deployment",
  },
  {
    title: "I buy or process crops",
    body: "For buyers and processors who need clearer supply, quality, and timing.",
    href: "/partner?interest=commodity_sourcing",
  },
  {
    title: "I want to invest or partner",
    body: "For investors, research teams, and strategic partners looking for the right next step.",
    href: "/partner?interest=investment",
  },
] as const;

export default function LandingPage() {
  return (
    <div id="top">
      <a href="#main" className="skip-link">Skip to main content</a>
      <SiteNav />

      <main id="main">
        <section className="hero">
          <div className="hero-bg" aria-hidden />
          <div className="aeris-container hero-shell">
            <div className="hero-copy">
              <div className="hero-kicker">AERIS Agro</div>
              <h1 className="hero-title">
                Agricultural intelligence for{" "}
                <span className="gold">Uganda&apos;s farming economy.</span>
              </h1>
              <p className="hero-sub">
                AERIS helps districts, farmer groups, and buyers see problems earlier,
                share simpler guidance, and move crops through a clearer path to market.
              </p>

              <div className="hero-actions">
                <Link href="/partner" className="aeris-btn-primary">
                  Start a partnership <ArrowRight size={16} />
                </Link>
                <Link href="/questions" className="aeris-btn-ghost">
                  Ask a question
                </Link>
              </div>
            </div>

            <div className="hero-rail">
              <div className="hero-rail-item">District teams</div>
              <div className="hero-rail-item">Farmer groups</div>
              <div className="hero-rail-item">Buyers and processors</div>
            </div>
          </div>
        </section>

        <section id="choose-path" className="aeris-section choose-path-section">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">Choose your path</div>
              <h2 className="aeris-h1">
                Start with the route that{" "}
                <span className="green">matches your next step.</span>
              </h2>
              <p className="aeris-body section-lede">
                Pick the option that fits you best. Each route leads to a more relevant next conversation.
              </p>
            </div>

            <div className="path-grid">
              {PATHS.map((path) => (
                <PathCard key={path.title} {...path} />
              ))}
            </div>
          </div>
        </section>

        <section id="platforms" className="aeris-section">
          <div className="aeris-container">
            <div className="section-intro">
              <div className="section-eyebrow">What we offer</div>
              <h2 className="aeris-h1">
                Three tools.{" "}
                <span className="green">One connected service.</span>
              </h2>
              <p className="aeris-body section-lede">
                AERIS combines early warning, farmer guidance, and market connection so the same information can support decisions at different points in the chain.
              </p>
            </div>

            <div className="platform-grid">
              {PLATFORM_CARDS.map((card) => (
                <PillarCard key={card.name} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section id="who-it-serves" className="audience-band">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">Who it serves</div>
              <h2 className="aeris-h1">
                Simple information for the people{" "}
                <span className="green">moving agriculture forward.</span>
              </h2>
              <p className="aeris-body section-lede">
                Each group needs a different next step. AERIS keeps the message clear enough for each audience to use.
              </p>
            </div>

            <div className="audience-grid">
              {AUDIENCE_CARDS.map((card) => (
                <AudienceCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="aeris-section">
          <div className="aeris-container">
            <div className="section-intro">
              <div className="section-eyebrow">How it helps</div>
              <h2 className="aeris-h1">
                A small sequence that makes{" "}
                <span className="green">the next decision easier.</span>
              </h2>
              <p className="aeris-body section-lede">
                The site is organized to explain the value first, then show how that value reaches farmers, public teams, and buyers.
              </p>
            </div>

            <div className="workflow-grid">
              {HOW_IT_WORKS.map((step, index) => (
                <StepCard key={step.title} index={index + 1} {...step} />
              ))}
            </div>
          </div>
        </section>

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
                AERIS is shaped around basic phones, district operations, changing weather, farmer groups, and crop buyers who need dependable information before they act.
              </p>
            </div>

            <div className="proof-grid">
              {FIELD_CARDS.map((card) => (
                <ProofCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="aeris-section why-now-section">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered">
              <div className="section-eyebrow">Why now</div>
              <h2 className="aeris-h1">
                The right tools can now reach{" "}
                <span className="green">the right people.</span>
              </h2>
              <p className="aeris-body section-lede">
                The site leans on what is possible now: earlier warning, simpler access, and more reliable transaction steps.
              </p>
            </div>

            <div className="why-grid">
              {WHY_NOW.map((card) => (
                <ProofCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="aeris-section partner-section">
          <div className="aeris-container">
            <div className="section-intro section-intro-centered partner-intro-centered">
              <div className="section-eyebrow">Start a conversation</div>
              <h2 className="aeris-h1">
                Pick the route that{" "}
                <span className="green">fits your next step.</span>
              </h2>
              <p className="aeris-body partner-lede">
                Use the partner page for requests and the questions page for comments or clarifications.
              </p>
            </div>

            <div className="partner-cta-row">
              <Link href="/partner" className="aeris-btn-primary">
                Partner request <ArrowRight size={16} />
              </Link>
              <Link href="/questions" className="aeris-btn-ghost">
                Questions or comments
              </Link>
            </div>
          </div>
        </section>
      </main>

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
                { label: "Aeryion", href: AERYION_URL || "#", external: !!AERYION_URL },
                { label: "Coltiva", href: COLTIVA_URL, external: true },
                { label: "LinkTrade", href: LINKTRADE_URL || "#", external: !!LINKTRADE_URL },
              ]}
            />

            <FooterColumn
              title="Explore"
              links={[
                { label: "Choose path", href: "#choose-path" },
                { label: "Who it serves", href: "#who-it-serves" },
                { label: "What we offer", href: "#platforms" },
                { label: "How it helps", href: "#how-it-works" },
                { label: "Grounded in the field", href: "#field" },
                { label: "Partner request", href: "/partner" },
                { label: "Questions", href: "/questions" },
                { label: "FAQ", href: "/faq" },
                { label: "Privacy Policy", href: "/privacy" },
              ]}
            />

            <FooterColumn
              title="Contact"
              links={[
                { label: "aerisagro@gmail.com", href: "mailto:aerisagro@gmail.com" },
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

function SectionCard({
  icon, label, title, body,
}: {
  icon: ReactNode;
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

function ProofCard(props: {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
}) {
  return <SectionCard {...props} />;
}

function AudienceCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="audience-card">
      <div className="audience-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function StepCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <article className="workflow-card">
      <div className="workflow-num">{String(index).padStart(2, "0")}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
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
  icon,
  name,
  role,
  status,
  bullets,
  audience,
  href,
  cta,
  bgImage,
}: {
  icon: ReactNode;
  name: string;
  role: string;
  status: string;
  bullets: readonly string[];
  audience: string;
  href: string;
  cta: string;
  bgImage: string;
}) {
  const bgStyle = { "--pillar-bg": `url(${bgImage})` } as CSSProperties;
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      className="aeris-card pillar-card"
      style={bgStyle}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      <div className="pillar-media" aria-hidden />
      <div className="pillar-shade" aria-hidden />
      <div className="pillar-top">
        <div className="pillar-icon">{icon}</div>
        <div className="pillar-head">
          <div className="pillar-name">{name}</div>
          <div className="pillar-role">{role}</div>
          <div className="pillar-status">{status}</div>
        </div>
      </div>
      <div className="pillar-details">
        <ul className="pillar-bullets">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="pillar-audience">For: {audience}</div>
        <div className="pillar-cta">
          {cta}
          <ArrowRight size={16} />
        </div>
      </div>
    </a>
  );
}

function FooterColumn({
  title,
  links,
}: {
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

function FooterLink({
  label,
  href,
  external,
}: {
  label: string;
  href?: string;
  external?: boolean;
}) {
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
