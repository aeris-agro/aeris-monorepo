import Link from "next/link";

export function SiteNav() {
  return (
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
          height:         "68px",
        }}
      >
        <Link href="/" className="coltiva-logo">
          <span className="coltiva-logo-mark">C</span>
          <span className="coltiva-logo-text">Coltiva</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/login"
            style={{
              color:          "var(--fg-nav)",
              fontSize:       "var(--text-md)",
              fontWeight:     500,
              padding:        "0.5rem 0.875rem",
              borderRadius:   "var(--radius-pill)",
            }}
          >
            Log in
          </Link>
          <Link href="/signup" className="aeris-btn-primary" style={{ padding: "0.6rem 1.25rem" }}>
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
