"use client";

import { useEffect, useState } from "react";

interface Line {
  t:     string;
  c?:    string;
  bold?: boolean;
}

interface Screen {
  title:  string;
  lines:  Line[];
  note:   string;
}

const SCREENS: Screen[] = [
  {
    title: "Step 1 — Dial",
    lines: [{ t: "Dialling *217#…", c: "var(--fg-dim)" }],
    note:  "Works on ANY phone. No internet needed.",
  },
  {
    title: "Step 2 — Choose crop",
    lines: [
      { t: "CON Welcome to Coltiva", c: "var(--accent-dim)", bold: true },
      { t: "Farming intelligence for Lango", c: "var(--fg-muted)" },
      { t: "" },
      { t: "Select your crop:" },
      { t: "1. Maize" },
      { t: "2. Sesame" },
      { t: "3. Sorghum" },
      { t: "4. Soya Beans" },
      { t: "5. Sunflower" },
      { t: "6. Cassava" },
    ],
    note: "Supports 6 pilot crops.",
  },
  {
    title: "Step 3 — Your advice",
    lines: [
      { t: "END Your Coltiva Report", c: "var(--accent-dim)", bold: true },
      { t: "─────────────────",        c: "var(--fg-dim)" },
      { t: "Weather: 18mm rain" },
      { t: "  forecast — next 7 days" },
      { t: "" },
      { t: "Soil: Apply 2 bottle" },
      { t: "  caps DAP per plant row" },
      { t: "" },
      { t: "Maize price today:" },
      { t: "  UGX 750/kg in Lira" },
      { t: "" },
      { t: "FAW risk: LOW", c: "var(--accent)" },
    ],
    note: "Personalised. Specific. Actionable.",
  },
];

export function PhoneMockup() {
  const [screen, setScreen] = useState(0);
  const [typed,  setTyped]  = useState(0);

  useEffect(() => {
    const lines = SCREENS[screen].lines;
    if (typed < lines.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), screen === 0 ? 800 : 110);
      return () => clearTimeout(t);
    }
    // Hold the full screen, then advance or loop
    const advance =
      screen < SCREENS.length - 1
        ? setTimeout(() => { setScreen((s) => s + 1); setTyped(0); }, 2400)
        : setTimeout(() => { setScreen(0);             setTyped(0); }, 3500);
    return () => clearTimeout(advance);
  }, [screen, typed]);

  const current = SCREENS[screen];

  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "1rem",
      }}
    >
      {/* Phone body */}
      <div
        style={{
          width:        "220px",
          background:   "#1a1a1a",
          borderRadius: "32px",
          padding:      "12px 8px",
          boxShadow:    "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)",
          position:     "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            width:           "70px",
            height:          "22px",
            background:      "#111",
            borderRadius:    "12px",
            margin:          "0 auto 8px",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#333" }} />
        </div>

        {/* Screen */}
        <div
          style={{
            background:   "#e8f5e9",
            borderRadius: "20px",
            padding:      "14px 12px",
            minHeight:    "280px",
            fontFamily:   '"Geist Mono", "Fira Code", monospace',
            fontSize:     "11px",
            lineHeight:   1.7,
            position:     "relative",
            overflow:     "hidden",
            color:        "var(--fg)",
          }}
        >
          {/* Status bar */}
          <div
            style={{
              display:        "flex",
              justifyContent: "space-between",
              marginBottom:   "10px",
              fontSize:       "9px",
              color:          "var(--fg-dim)",
            }}
          >
            <span>11:42</span>
            <span>MTN UG · *217#</span>
          </div>

          {/* Lines */}
          {current.lines.slice(0, typed).map((line, i) => (
            <div
              key={i}
              style={{
                color:      line.c ?? "var(--fg)",
                fontWeight: line.bold ? 700 : 400,
                minHeight:  line.t === "" ? "6px" : "auto",
              }}
            >
              {line.t}
            </div>
          ))}

          {typed < current.lines.length && (
            <span style={{ color: "var(--accent)", animation: "blink 1s infinite" }}>▋</span>
          )}
        </div>

        {/* Home button */}
        <div
          style={{
            width:           "40px",
            height:          "40px",
            borderRadius:    "50%",
            border:          "2px solid #333",
            margin:          "10px auto 4px",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid #444" }} />
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {SCREENS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setScreen(i); setTyped(0); }}
            aria-label={`Go to ${SCREENS[i].title}`}
            style={{
              width:        i === screen ? "24px" : "8px",
              height:       "8px",
              borderRadius: "4px",
              border:       "none",
              cursor:       "pointer",
              background:   i === screen ? "var(--accent)" : "rgba(34,128,63,0.18)",
              transition:   "all 0.3s",
              padding:      0,
            }}
          />
        ))}
      </div>

      {/* Step note */}
      <div
        style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border-card)",
          borderRadius: "10px",
          padding:      "0.5rem 0.875rem",
          fontSize:     "var(--text-sm)",
          color:        "var(--fg-muted)",
          textAlign:    "center",
          fontStyle:    "italic",
          maxWidth:     "240px",
        }}
      >
        {current.note}
      </div>
    </div>
  );
}
