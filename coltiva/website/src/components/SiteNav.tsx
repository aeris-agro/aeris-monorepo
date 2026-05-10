"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        style={{
          position:        "sticky",
          top:             0,
          zIndex:          50,
          background:      "var(--nav-bg)",
          backdropFilter:  "blur(12px)",
          borderBottom:    "1px solid var(--border-nav)",
        }}
      >
        <div
          className="aeris-container"
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            height:         "64px",
          }}
        >
          <Link href="/" className="coltiva-logo" onClick={() => setOpen(false)}>
            <span className="coltiva-logo-mark">C</span>
            <span className="coltiva-logo-text">Coltiva</span>
          </Link>

          {/* Desktop links — hidden below 640px via CSS class */}
          <div className="nav-desktop">
            <Link
              href="/login"
              style={{
                color:        "var(--fg-nav)",
                fontSize:     "var(--text-md)",
                fontWeight:   500,
                padding:      "0.5rem 0.875rem",
                borderRadius: "var(--radius-pill)",
              }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="aeris-btn-primary"
              style={{ padding: "0.6rem 1.25rem" }}
            >
              Sign up
            </Link>
          </div>

          {/* Hamburger — shown below 640px via CSS class */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="nav-hamburger"
            style={{
              background:    "transparent",
              border:        "1px solid var(--border)",
              borderRadius:  "var(--radius-sm)",
              width:         "44px",
              height:        "44px",
              display:       "none",
              alignItems:    "center",
              justifyContent:"center",
              cursor:        "pointer",
              padding:       0,
            }}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className="nav-drawer"
        style={{
          position:       "fixed",
          inset:          0,
          top:            "64px",
          background:     "var(--bg)",
          zIndex:         40,
          display:        open ? "flex" : "none",
          flexDirection:  "column",
          alignItems:     "stretch",
          padding:        "1.5rem",
          gap:            "0.75rem",
        }}
      >
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="aeris-btn-ghost"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          onClick={() => setOpen(false)}
          className="aeris-btn-primary"
          style={{ width: "100%" }}
        >
          Create your free account
        </Link>

        <div
          style={{
            marginTop:   "auto",
            paddingTop:  "2rem",
            fontSize:    "var(--text-sm)",
            color:       "var(--fg-dim)",
            textAlign:   "center",
          }}
        >
          Coltiva · part of AERIS Group · Built in Uganda
        </div>
      </div>
    </>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <line
        x1="2" y1={open ? "10" : "5"} x2="18" y2={open ? "10" : "5"}
        stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round"
        style={{ transformOrigin: "center", transform: open ? "rotate(45deg)" : "none", transition: "transform .2s" }}
      />
      <line
        x1="2" y1="10" x2="18" y2="10"
        stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round"
        style={{ opacity: open ? 0 : 1, transition: "opacity .2s" }}
      />
      <line
        x1="2" y1={open ? "10" : "15"} x2="18" y2={open ? "10" : "15"}
        stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round"
        style={{ transformOrigin: "center", transform: open ? "rotate(-45deg)" : "none", transition: "transform .2s" }}
      />
    </svg>
  );
}
