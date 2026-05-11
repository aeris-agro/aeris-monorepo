"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Home,
  Sprout,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { clearSession, getUserProfile } from "@/lib/session";
import type { UserProfile } from "@/lib/session";

const NAV = [
  { href: "/",        label: "Home",     icon: Home },
  { href: "/farm",    label: "Your Farm", icon: Sprout },
  { href: "/chat",    label: "Ask Coltiva", icon: MessageCircle },
  { href: "/profile", label: "Profile",   icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open,    setOpen]    = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  function handleLogout() {
    clearSession();
    const websiteUrl =
      process.env.NEXT_PUBLIC_COLTIVA_WEBSITE_URL ?? "http://localhost:3002";
    window.location.href = websiteUrl;
  }

  return (
    <div className="app-shell">
      {/* Mobile topbar */}
      <header className="app-topbar">
        <Link href="/" className="coltiva-logo">
          <span className="coltiva-logo-mark">C</span>
          <span className="coltiva-logo-text">Coltiva</span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          style={{
            background:    "transparent",
            border:        "1px solid var(--border)",
            borderRadius:  "var(--radius-sm)",
            width:         "44px",
            height:        "44px",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            cursor:        "pointer",
          }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Drawer overlay (mobile only, when open) */}
      <div
        className={`drawer-overlay ${open ? "is-visible" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Sidebar — desktop always, mobile slides in when `is-open` */}
      <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/" className="coltiva-logo">
          <span className="coltiva-logo-mark">C</span>
          <span className="coltiva-logo-text">Coltiva</span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`side-link ${active ? "is-active" : ""}`}
              >
                <Icon size={18} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile pill at bottom */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {profile && (
            <div
              style={{
                padding:      "0.75rem",
                background:   "var(--bg-2)",
                borderRadius: "var(--radius-sm)",
                border:       "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--fg)" }}>
                {profile.full_name}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.125rem" }}>
                {profile.role.replace(/_/g, " ")}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="side-link"
            style={{ width: "100%", justifyContent: "flex-start", color: "var(--fg-muted)" }}
          >
            <LogOut size={18} aria-hidden />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <div id="main-content" className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
