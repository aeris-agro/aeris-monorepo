"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#choose-path",   label: "Choose path" },
  { href: "#platforms",     label: "What we offer" },
  { href: "#how-it-works",  label: "How it helps" },
  { href: "/faq",           label: "FAQ" },
  { href: "/questions",     label: "Questions" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className="glass-nav">
        <div className="aeris-container nav-shell">
          <a href="#top" className="aeris-wordmark" aria-label="AERIS Agro home">
            AERI<span>S AGRO</span>
          </a>

          <div className="nav-desktop-only nav-links">
            {NAV_LINKS.map((l) => (
              l.href.startsWith("/") ? (
                <Link
                  key={l.href}
                  href={l.href}
                  className="nav-link"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="nav-link"
                >
                  {l.label}
                </a>
              )
            ))}
            <a href="/partner" className="aeris-btn-primary nav-cta">
              Partner
            </a>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="nav-mobile-only"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div className={`nav-drawer ${open ? "is-open" : ""}`}>
        <div className="nav-drawer-header">
          <div className="section-eyebrow">Menu</div>
          <p>Jump to the main sections or start a request.</p>
        </div>
        {NAV_LINKS.map((l) => (
          l.href.startsWith("/") ? (
            <Link
              key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className="nav-drawer-link"
            >
              {l.label}
            </Link>
          ) : (
            <a
              key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className="nav-drawer-link"
            >
              {l.label}
            </a>
          )
        ))}
        <a href="/partner" onClick={() => setOpen(false)} className="aeris-btn-primary nav-drawer-cta">
          Partner
        </a>
      </div>
    </>
  );
}
