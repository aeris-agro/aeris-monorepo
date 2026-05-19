"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#platforms",     label: "Platforms" },
  { href: "#how-it-works",  label: "How it works" },
  { href: "#partner",       label: "Partner with us" },
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
        <div
          className="aeris-container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}
        >
          <a href="#top" className="aeris-wordmark" aria-label="AERIS Agro home">
            AERI<span>S AGRO</span>
          </a>

          <div className="nav-desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  color: "var(--fg-nav)", fontSize: "var(--text-md)", fontWeight: 500,
                  padding: "0.5rem 0.875rem", borderRadius: "var(--radius-sm)",
                }}
              >
                {l.label}
              </a>
            ))}
            <a href="#partner" className="aeris-btn-primary" style={{ marginLeft: "0.75rem" }}>
              Get in touch
            </a>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="nav-mobile-only"
            style={{
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", width: "44px", height: "44px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--fg)",
            }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div className={`nav-drawer ${open ? "is-open" : ""}`}>
        {NAV_LINKS.map((l) => (
          <a
            key={l.href} href={l.href}
            onClick={() => setOpen(false)}
            style={{
              color: "var(--fg)", fontSize: "var(--text-xl)", fontWeight: 600,
              padding: "0.875rem 0", borderBottom: "1px solid var(--border)",
            }}
          >
            {l.label}
          </a>
        ))}
        <a
          href="#partner" onClick={() => setOpen(false)}
          className="aeris-btn-primary"
          style={{ marginTop: "1rem", width: "100%" }}
        >
          Get in touch
        </a>
      </div>
    </>
  );
}
