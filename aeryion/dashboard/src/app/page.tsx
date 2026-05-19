"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  TriangleAlert,
  CloudRain,
  Layers,
  Satellite,
  Brain,
  MapPin,
  FileText,
  Download,
  RefreshCw,
  Droplets,
  Thermometer,
  Wifi,
  CloudLightning,
  Bug,
  Sun,
  Map,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "overview"
  | "alerts"
  | "weather"
  | "soil"
  | "satellite"
  | "forecast";

interface NdviRecord {
  sub_county: string;
  observed_date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  vegetation_status: string;
}

interface ForecastDay {
  date: string;
  rainfall_mm: number;
  confidence_pct: number;
}

interface Alert {
  id: string;
  sub_county: string;
  alert_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  forecast_date: string;
  confidence_pct: number;
  message_en: string;
  message_luo: string | null;
  active: boolean;
  created_at: string;
}

// ── Severity helpers (backend returns uppercase 4-level severity) ──
const sevClass = (s: Alert["severity"]) =>
  s === "CRITICAL" ? "warn" : s === "HIGH" ? "amber" : s === "MEDIUM" ? "amber" : "info";

const sevBadge = (s: Alert["severity"]) =>
  s === "CRITICAL" ? "badge-red" : s === "HIGH" ? "badge-amber" : s === "MEDIUM" ? "badge-amber" : "badge-green";

const sevIconColor = (s: Alert["severity"]) =>
  s === "CRITICAL" ? "#e85d5d" : s === "HIGH" || s === "MEDIUM" ? "#f0a500" : "#2ecc71";

// Derive a human title from alert_type (e.g. "rainfall_heavy" -> "Rainfall heavy")
const alertTitle = (a: Alert) =>
  a.alert_type.replace(/_/g, " ").replace(/\b\w/, (c) => c.toUpperCase());

interface SoilRecord {
  sub_county: string;
  district: string;
  ph_value: number | null;
  nitrogen_pct: number | null;
  phosphorous_ppm: number | null;
  organic_carbon_pct: number | null;
  clay_pct: number | null;
  texture_class: string | null;
  soil_health: string;
  observed_date: string;
  data_source: string;
}

interface RainfallHistoryPoint {
  date: string;
  rainfall_mm: number;
}

interface RainfallSeries {
  sub_county: string;
  daily: RainfallHistoryPoint[];
}

interface RainfallHistory {
  start_date: string;
  end_date: string;
  data_source: string;
  days: number;
  series: RainfallSeries[];
}

interface LiveData {
  ndvi: NdviRecord[];
  forecast: ForecastDay[];
  alerts: Alert[];
  soil: SoilRecord[];
  rainfallHistory: RainfallHistory | null;
}

// ── Static fallback / supplemental data ──────────────────────────────────────
const TEMP_30D = [
  82, 85, 80, 88, 78, 90, 86, 84, 88, 85, 88, 90, 86, 84, 82, 85, 88, 86, 84,
  82, 85, 83, 80, 85, 84, 88, 86, 84, 82, 85,
];
const NDVI_30D = [
  45, 50, 55, 60, 65, 68, 72, 75, 70, 68, 65, 62, 60, 58, 55, 52, 55, 58, 62,
  66, 70, 74, 78, 75, 72, 70, 68, 72, 76, 78,
];

const SAT_TILES = [
  {
    name: "NDVI — Lira",
    desc: "Vegetation health",
    color: "rgba(34,128,63,0.4)",
  },
  {
    name: "NDWI — Oyam",
    desc: "Water index · Flood",
    color: "rgba(58,143,212,0.4)",
  },
  {
    name: "NDVI — Dokolo",
    desc: "Pest stress visible",
    color: "rgba(240,165,0,0.4)",
  },
  {
    name: "LST — Lango",
    desc: "Land surface temp",
    color: "rgba(232,93,93,0.3)",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ndviColor(v: number) {
  if (v >= 0.55) return "#2ecc71";
  if (v >= 0.4) return "#f0a500";
  return "#e85d5d";
}
function ndviStatus(v: number) {
  if (v >= 0.55) return "Healthy";
  if (v >= 0.4) return "Moderate";
  return "Stressed";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-UG", {
    month: "short",
    day: "numeric",
  });
}
function fmtDay(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-UG", { weekday: "short" })
    .toUpperCase()
    .slice(0, 3);
}
function rainfallIcon(mm: number) {
  if (mm > 15) return "⛈";
  if (mm > 5) return "🌧";
  if (mm > 1) return "🌦";
  return "☀";
}

function soilHealthBadgeCls(health: string) {
  switch (health) {
    case "EXCELLENT":
      return "badge-green";
    case "GOOD":
      return "badge-green";
    case "MODERATE":
      return "badge-amber";
    case "POOR":
      return "badge-red";
    default:
      return "badge-gray";
  }
}

// ── Shared components ─────────────────────────────────────────────────────────
function ChartBars({
  data,
  height,
  cls,
}: {
  data: number[];
  height: number;
  cls?: (v: number, i: number) => string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="chart-area" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`chart-bar ${cls ? cls(v, i) : ""}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function LstmBars({
  data,
  splitAt,
  height,
}: {
  data: number[];
  splitAt: number;
  height: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="lstm-bars" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`lstm-bar ${i < splitAt ? "actual" : "forecast"}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function Legend({
  color,
  dashed,
  label,
}: {
  color: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.72rem",
        color: "var(--fg-dim)",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          border: dashed ? "1px dashed rgba(46,204,113,0.6)" : undefined,
        }}
      />
      {label}
    </div>
  );
}

function ForecastStrip({ forecast }: { forecast: ForecastDay[] }) {
  return (
    <div className="forecast-strip">
      {forecast.slice(0, 7).map((d, i) => (
        <div key={i} className={`forecast-day${i === 0 ? " today" : ""}`}>
          <div className="forecast-day-name">{fmtDay(d.date)}</div>
          <div className="forecast-icon">{rainfallIcon(d.rainfall_mm)}</div>
          <div className="forecast-temp">{d.rainfall_mm.toFixed(1)}</div>
          <div className="forecast-rain">{d.confidence_pct.toFixed(0)}%</div>
        </div>
      ))}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewScreen({
  go,
  data,
}: {
  go: (s: Screen) => void;
  data: LiveData;
}) {
  const avgNdvi =
    data.ndvi.length > 0
      ? (
          data.ndvi.reduce((s, d) => s + d.ndvi_mean, 0) / data.ndvi.length
        ).toFixed(2)
      : "—";
  const totalRain = data.forecast
    .reduce((s, d) => s + d.rainfall_mm, 0)
    .toFixed(1);
  const activeAlerts = data.alerts.filter((a) => a.active).length;

  const MAP_DISTRICTS = [
    { name: "Lira", top: "38%", left: "40%" },
    { name: "Oyam", top: "28%", left: "58%" },
    { name: "Dokolo", top: "55%", left: "30%" },
    { name: "Kole", top: "65%", left: "55%" },
  ];

  return (
    <>
      <div className="metric-strip">
        <div className="metric-card" onClick={() => go("weather")}>
          <div className="metric-label">
            <Droplets size={11} /> Rainfall (7-day)
          </div>
          <div className="metric-value">
            {totalRain}
            <span>mm</span>
          </div>
          <div className="metric-sub">LSTM forecast · Lango</div>
        </div>
        <div className="metric-card" onClick={() => go("satellite")}>
          <div className="metric-label">
            <Satellite size={11} /> Avg NDVI
          </div>
          <div className="metric-value">{avgNdvi}</div>
          <div className="metric-sub">
            {data.ndvi.length > 0
              ? `${data.ndvi[0].observed_date} · Sentinel-2`
              : "Loading..."}
          </div>
        </div>
        <div className="metric-card" onClick={() => go("alerts")}>
          <div className="metric-label">
            <TriangleAlert size={11} color="#e85d5d" /> Active Alerts
          </div>
          <div className={`metric-value${activeAlerts > 0 ? " red" : ""}`}>
            {activeAlerts}
          </div>
          <div className="metric-sub">
            {activeAlerts === 0
              ? "All districts nominal"
              : `${activeAlerts} require attention`}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            <Wifi size={11} /> IoT Stations
          </div>
          <div className="metric-value">
            11<span>/14</span>
          </div>
          <div className="metric-sub">3 stations offline</div>
        </div>
      </div>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Lango Sub-region — Live Map</div>
                <div className="panel-sub">
                  Lira · Oyam · Dokolo · Apach · Kole
                </div>
              </div>
              <span className="topbar-tag blue">Sentinel-2</span>
            </div>
            <div className="panel-body">
              <div className="map-area">
                <div className="map-grid" />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(ellipse at 45% 55%, rgba(34,128,63,0.22) 0%, transparent 65%)",
                  }}
                />
                {MAP_DISTRICTS.map((d) => {
                  const rec = data.ndvi.find((n) =>
                    n.sub_county.toLowerCase().includes(d.name.toLowerCase()),
                  );
                  const dotType = rec
                    ? rec.ndvi_mean >= 0.55
                      ? ""
                      : rec.ndvi_mean >= 0.4
                        ? "amber"
                        : "warn"
                    : "";
                  const labelColor =
                    dotType === "warn"
                      ? "rgba(232,93,93,0.9)"
                      : dotType === "amber"
                        ? "rgba(240,165,0,0.9)"
                        : "rgba(46,204,113,0.9)";
                  return (
                    <div key={d.name}>
                      <div
                        className={`map-dot ${dotType}`}
                        style={{ top: d.top, left: d.left }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: `calc(${d.top} - 14px)`,
                          left: `calc(${d.left} + 14px)`,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: labelColor,
                        }}
                      >
                        {d.name}
                        {rec ? ` ${rec.ndvi_mean.toFixed(2)}` : ""}
                      </div>
                    </div>
                  );
                })}
                <div className="map-label">
                  Lango Sub-region · Northern Uganda
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Rainfall — 30-day History</div>
                <div className="panel-sub">
                  {data.rainfallHistory
                    ? `CHIRPS · 30 days ending ${data.rainfallHistory.end_date}`
                    : "CHIRPS daily · loading"}
                </div>
              </div>
            </div>
            <div className="panel-body">
              {(() => {
                // Pick Lira's series as the headline; fallback to first available.
                const series = data.rainfallHistory?.series ?? [];
                const lira =
                  series.find((s) => s.sub_county === "Lira") ?? series[0];
                const values = lira?.daily.map((d) => d.rainfall_mm) ?? [];
                if (values.length === 0) {
                  return (
                    <div
                      style={{
                        height: 90,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--fg-dim)",
                        fontSize: "0.72rem",
                      }}
                    >
                      No rainfall history available
                    </div>
                  );
                }
                return (
                  <ChartBars
                    data={values}
                    height={90}
                    cls={(h) => (h > 20 ? "hi" : h < 6 ? "lo" : "")}
                  />
                );
              })()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Active Alerts</div>
              <span className={`topbar-tag${activeAlerts > 0 ? " red" : ""}`}>
                {activeAlerts > 0 ? `${activeAlerts} Active` : "All Clear"}
              </span>
            </div>
            <div className="panel-body" style={{ padding: "12px 16px" }}>
              {activeAlerts === 0 ? (
                <div className="alert-card info">
                  <div className="alert-icon info">
                    <Sun size={14} color="#2ecc71" />
                  </div>
                  <div>
                    <div className="alert-title">No active alerts</div>
                    <div className="alert-meta">
                      All districts nominal · Live data
                    </div>
                  </div>
                </div>
              ) : (
                data.alerts
                  .filter((a) => a.active)
                  .map((a) => (
                    <div
                      key={a.id}
                      className={`alert-card ${sevClass(a.severity)}`}
                    >
                      <div
                        className={`alert-icon ${sevClass(a.severity)}`}
                      >
                        {a.alert_type.startsWith("rainfall") ? (
                          <CloudLightning size={14} color={sevIconColor(a.severity)} />
                        ) : a.alert_type.startsWith("pest") ? (
                          <Bug size={14} color={sevIconColor(a.severity)} />
                        ) : (
                          <Sun size={14} color={sevIconColor(a.severity)} />
                        )}
                      </div>
                      <div>
                        <div className="alert-title">{alertTitle(a)}</div>
                        <div className="alert-meta">
                          {a.sub_county} · Lango
                        </div>
                      </div>
                      <div className="alert-badge">
                        <span
                          className={`badge ${sevBadge(a.severity)}`}
                        >
                          {a.severity}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">7-Day Forecast</div>
              <span className="topbar-tag blue">LSTM · Live</span>
            </div>
            <div className="panel-body" style={{ padding: 12 }}>
              {data.forecast.length > 0 ? (
                <ForecastStrip forecast={data.forecast} />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--fg-dim)",
                    fontSize: "0.8rem",
                    padding: "20px 0",
                  }}
                >
                  Loading forecast...
                </div>
              )}
              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.68rem",
                  color: "var(--fg-dim)",
                  textAlign: "center",
                }}
              >
                mm rainfall · confidence %
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Alerts ────────────────────────────────────────────────────────────────────
function AlertsScreen({ data }: { data: LiveData }) {
  const critical = data.alerts.filter(
    (a) => a.active && a.severity === "CRITICAL",
  ).length;
  const warnings = data.alerts.filter(
    (a) => a.active && (a.severity === "HIGH" || a.severity === "MEDIUM"),
  ).length;
  return (
    <>
      <div
        className="metric-strip"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}
      >
        <div className="metric-card">
          <div className="metric-label">Critical</div>
          <div className={`metric-value${critical > 0 ? " red" : ""}`}>
            {critical}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Warnings</div>
          <div className="metric-value amber">
            <span>{warnings}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Resolved (7d)</div>
          <div className="metric-value">0</div>
        </div>
      </div>

      {data.alerts.length === 0 ? (
        <div className="alert-card info">
          <div className="alert-icon info" style={{ width: 38, height: 38 }}>
            <Sun size={16} color="#2ecc71" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="alert-title">
              No active alerts across Lango sub-region
            </div>
            <div
              className="alert-meta"
              style={{
                marginTop: 4,
                fontSize: "0.8rem",
                lineHeight: 1.6,
                color: "var(--fg-muted)",
              }}
            >
              All monitored districts are within normal parameters. NDVI,
              rainfall, and soil moisture readings nominal.
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: "0.72rem",
                color: "var(--fg-dim)",
              }}
            >
              Source: CHIRPS + Sentinel-2 + IoT · Live
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <span className="badge badge-green">All Clear</span>
          </div>
        </div>
      ) : (
        data.alerts.map((a) => (
          <div
            key={a.id}
            className={`alert-card ${sevClass(a.severity)}`}
            style={{ marginBottom: 10 }}
          >
            <div
              className={`alert-icon ${sevClass(a.severity)}`}
              style={{ width: 38, height: 38 }}
            >
              {a.alert_type.startsWith("rainfall") ? (
                <CloudLightning size={16} color={sevIconColor(a.severity)} />
              ) : a.alert_type.startsWith("pest") ? (
                <Bug size={16} color={sevIconColor(a.severity)} />
              ) : (
                <Sun size={16} color={sevIconColor(a.severity)} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="alert-title">{alertTitle(a)}</div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.72rem",
                  color: "var(--fg-dim)",
                }}
              >
                {a.sub_county} · Lango · {new Date(a.created_at).toLocaleString('en-UG')}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span
                className={`badge ${sevBadge(a.severity)}`}
              >
                {a.severity}
              </span>
              <span className="badge badge-gray">
                {a.alert_type.toUpperCase()}
              </span>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ── Weather ───────────────────────────────────────────────────────────────────
function WeatherScreen({ data }: { data: LiveData }) {
  const totalMm = data.forecast
    .reduce((s, d) => s + d.rainfall_mm, 0)
    .toFixed(1);
  const avgConf =
    data.forecast.length > 0
      ? (
          data.forecast.reduce((s, d) => s + d.confidence_pct, 0) /
          data.forecast.length
        ).toFixed(0)
      : "—";
  const lstmData = data.forecast.map((d) => d.rainfall_mm);

  return (
    <>
      <div className="metric-strip">
        <div className="metric-card">
          <div className="metric-label">7-day Forecast Total</div>
          <div className="metric-value">
            {totalMm}
            <span>mm</span>
          </div>
          <div className="metric-sub">LSTM Model · live</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Model Confidence</div>
          <div className="metric-value">
            {avgConf}
            <span>%</span>
          </div>
          <div className="metric-sub">Avg across window</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Humidity</div>
          <div className="metric-value">
            74<span>%</span>
          </div>
          <div className="metric-sub">Lira · 9am reading</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Wind Speed</div>
          <div className="metric-value">
            12<span>km/h</span>
          </div>
          <div className="metric-sub">NE direction</div>
        </div>
      </div>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  LSTM Rainfall Forecast — 7 Days
                </div>
                <div className="panel-sub">
                  Live · Railway API · Lango sub-region
                </div>
              </div>
              <span className="topbar-tag blue">Live</span>
            </div>
            <div className="panel-body">
              <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <Legend
                  color="rgba(46,204,113,0.35)"
                  dashed
                  label="LSTM Forecast (live)"
                />
              </div>
              {lstmData.length > 0 ? (
                <LstmBars data={lstmData} splitAt={0} height={80} />
              ) : (
                <div
                  style={{
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--fg-dim)",
                    fontSize: "0.8rem",
                  }}
                >
                  Loading...
                </div>
              )}
              {data.forecast.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: "0.62rem", color: "var(--fg-dim)" }}>
                    {fmtDate(data.forecast[0].date)}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "var(--fg-dim)" }}>
                    {fmtDate(data.forecast[data.forecast.length - 1].date)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Temperature Range — Monthly</div>
            </div>
            <div className="panel-body">
              <ChartBars data={TEMP_30D} height={80} cls={() => "gold"} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">IoT Weather Stations</div>
            </div>
            <div className="panel-body" style={{ padding: "10px 16px" }}>
              <table className="station-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Rain</th>
                    <th>Temp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "L-01 Lira", r: "42mm", t: "28°C", on: true },
                    { id: "O-02 Oyam", r: "58mm", t: "26°C", on: true },
                    { id: "D-04 Dokolo", r: "31mm", t: "29°C", on: true },
                    { id: "A-02 Apach", r: "—", t: "—", on: false },
                    { id: "K-03 Kole", r: "24mm", t: "30°C", on: true },
                  ].map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span
                          className={
                            s.on ? "station-online" : "station-offline"
                          }
                        />
                        {s.id}
                      </td>
                      <td>{s.r}</td>
                      <td>{s.t}</td>
                      <td>
                        <span
                          className={`badge ${s.on ? "badge-green" : "badge-red"}`}
                        >
                          {s.on ? "Online" : "Offline"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">7-Day Forecast</div>
              <span className="topbar-tag blue">LSTM · Live</span>
            </div>
            <div className="panel-body" style={{ padding: 12 }}>
              {data.forecast.length > 0 ? (
                <ForecastStrip forecast={data.forecast} />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--fg-dim)",
                    padding: "20px 0",
                  }}
                >
                  Loading...
                </div>
              )}
              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.68rem",
                  color: "var(--fg-dim)",
                  textAlign: "center",
                }}
              >
                mm rainfall · confidence %
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Satellite (live NDVI) ─────────────────────────────────────────────────────
function SatelliteScreen({ data }: { data: LiveData }) {
  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "var(--fg-dim)" }}>
          Sentinel-2 · Landsat-8 · Google Earth Engine
          {data.ndvi.length > 0
            ? ` · Last pass ${data.ndvi[0].observed_date}`
            : ""}
        </div>
        <span className="topbar-tag blue">GEE Processing</span>
      </div>

      <div className="four-col" style={{ marginBottom: 16 }}>
        {SAT_TILES.map((t) => {
          const dim = t.color.replace(/[\d.]+\)$/, "0.15)");
          return (
            <div
              key={t.name}
              className="sat-tile"
              style={{
                background: `linear-gradient(135deg,#061008,${dim} 60%,#061008)`,
              }}
            >
              <div className="sat-scanlines" />
              <div
                className="sat-overlay"
                style={{
                  background: `radial-gradient(ellipse at 50% 50%,${t.color} 0%,transparent 65%)`,
                }}
              />
              <div className="sat-label">{t.name}</div>
              <div className="sat-badge">
                <span
                  className="topbar-tag"
                  style={{ fontSize: "0.55rem", padding: "2px 7px" }}
                >
                  {t.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {data.ndvi.length > 0 && (
        <div className="three-col" style={{ marginBottom: 16 }}>
          {data.ndvi.map((d) => {
            const color = ndviColor(d.ndvi_mean);
            return (
              <div
                key={d.sub_county}
                className="panel"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <div className="panel-header">
                  <div>
                    <div className="panel-title">{d.sub_county}</div>
                    <div className="panel-sub">
                      Sentinel-2 · {d.observed_date}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                      color,
                    }}
                  >
                    {ndviStatus(d.ndvi_mean)}
                  </span>
                </div>
                <div className="panel-body">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--fg-dim)",
                      }}
                    >
                      NDVI Mean
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color,
                      }}
                    >
                      {d.ndvi_mean.toFixed(4)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(d.ndvi_mean * 100)}%`,
                        background: color,
                        borderRadius: 3,
                        boxShadow: `0 0 8px ${color}`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.60rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--fg-dim)",
                          marginBottom: 2,
                        }}
                      >
                        Min
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          color: "var(--fg)",
                        }}
                      >
                        {d.ndvi_min.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.60rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--fg-dim)",
                          marginBottom: 2,
                        }}
                      >
                        Max
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          color: "var(--fg)",
                        }}
                      >
                        {d.ndvi_max.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">NDVI Time Series — Lira District</div>
            <div className="panel-sub">
              Vegetation greenness index · 0 = bare, 1 = dense canopy
            </div>
          </div>
        </div>
        <div className="panel-body">
          <ChartBars data={NDVI_30D} height={100} cls={() => "hi"} />
        </div>
      </div>
    </>
  );
}

// ── Forecast (live) ───────────────────────────────────────────────────────────
function ForecastScreen({ data }: { data: LiveData }) {
  const lstmData = data.forecast.map((d) => d.rainfall_mm);
  const totalMm = data.forecast
    .reduce((s, d) => s + d.rainfall_mm, 0)
    .toFixed(1);
  const avgConf =
    data.forecast.length > 0
      ? (
          data.forecast.reduce((s, d) => s + d.confidence_pct, 0) /
          data.forecast.length
        ).toFixed(0)
      : "—";

  return (
    <>
      <div
        className="metric-strip"
        style={{ gridTemplateColumns: "repeat(3,1fr)" }}
      >
        <div className="metric-card">
          <div className="metric-label">Avg Confidence</div>
          <div className="metric-value">
            {avgConf}
            <span>%</span>
          </div>
          <div className="metric-sub">7-day window</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Forecast Total</div>
          <div className="metric-value">
            {totalMm}
            <span>mm</span>
          </div>
          <div className="metric-sub">Next 7 days</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Inputs</div>
          <div className="metric-value blue">4</div>
          <div className="metric-sub">CHIRPS · Sentinel · IoT · Landsat</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Rainfall Forecast — LSTM Model</div>
              <div className="panel-sub">
                TensorFlow · Trained on 10 years CHIRPS data · Lango sub-region
              </div>
            </div>
            <span className="topbar-tag blue">Live</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(34,128,63,0.08)",
                  border: "1px solid rgba(34,128,63,0.18)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--green-bright)",
                    marginBottom: 4,
                  }}
                >
                  7-Day Forecast
                </div>
                <div
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "var(--fg)",
                  }}
                >
                  {totalMm}mm
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--fg-dim)" }}>
                  {data.forecast.length > 0
                    ? `${fmtDate(data.forecast[0].date)} – ${fmtDate(data.forecast[data.forecast.length - 1].date)}`
                    : "—"}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(58,143,212,0.08)",
                  border: "1px solid rgba(58,143,212,0.18)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(58,143,212,0.8)",
                    marginBottom: 4,
                  }}
                >
                  Confidence
                </div>
                <div
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "var(--fg)",
                  }}
                >
                  {avgConf}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--fg-dim)" }}>
                  Avg across window
                </div>
              </div>
            </div>

            {lstmData.length > 0 ? (
              <LstmBars data={lstmData} splitAt={0} height={120} />
            ) : (
              <div
                style={{
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--fg-dim)",
                }}
              >
                Loading...
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <Legend
                color="rgba(46,204,113,0.35)"
                dashed
                label="LSTM Forecast (live)"
              />
            </div>

            {data.forecast.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 12,
                }}
              >
                <div
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--fg-dim)",
                    marginBottom: 8,
                  }}
                >
                  Daily Breakdown
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  {data.forecast.map((d, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--fg-dim)",
                          width: 52,
                          flexShrink: 0,
                        }}
                      >
                        {fmtDate(d.date)}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "rgba(255,255,255,0.07)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min((d.rainfall_mm / 5) * 100, 100)}%`,
                            background: "rgba(46,204,113,0.5)",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                          color: "var(--green-bright)",
                          width: 48,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {d.rainfall_mm.toFixed(2)}mm
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--fg-dim)",
                          width: 34,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {d.confidence_pct.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Model Inputs</div>
            </div>
            <div className="panel-body" style={{ padding: "10px 16px" }}>
              {[
                {
                  bg: "var(--blue-dim)",
                  icon: <Satellite size={14} color="var(--blue)" />,
                  name: "CHIRPS Rainfall",
                  sub: "Climate Hazards Group · 5km resolution",
                  badge: "badge-green",
                  label: "Active",
                },
                {
                  bg: "rgba(34,128,63,0.12)",
                  icon: <Map size={14} color="var(--green-bright)" />,
                  name: "Sentinel-2 NDVI",
                  sub: "Google Earth Engine · 10m resolution",
                  badge: "badge-green",
                  label: "Active",
                },
                {
                  bg: "rgba(240,165,0,0.10)",
                  icon: <Wifi size={14} color="var(--amber)" />,
                  name: "IoT Weather Stations",
                  sub: "14 stations · Lango sub-region",
                  badge: "badge-amber",
                  label: "11/14",
                },
                {
                  bg: "rgba(232,93,93,0.10)",
                  icon: <Thermometer size={14} color="var(--red)" />,
                  name: "Landsat-8 LST",
                  sub: "Land surface temperature · 30m",
                  badge: "badge-green",
                  label: "Active",
                },
              ].map((s) => (
                <div key={s.name} className="sensor-row">
                  <div className="sensor-icon" style={{ background: s.bg }}>
                    {s.icon}
                  </div>
                  <div className="sensor-label">
                    <div className="sensor-name">{s.name}</div>
                    <div className="sensor-loc">{s.sub}</div>
                  </div>
                  <span className={`badge ${s.badge}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Published Events</div>
            </div>
            <div
              className="panel-body"
              style={{
                padding: "10px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--fg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span className="badge badge-green">WEATHER_ALERT</span> →
                Coltiva, LinkTrade
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--fg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span className="badge badge-blue">SOIL_REPORT_READY</span> →
                Coltiva
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--fg-dim)",
                  marginTop: 4,
                }}
              >
                Events published via Upstash Kafka bus
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Soil (LIVE iSDAsoil) ──────────────────────────────────────────────────────
function SoilScreen({ data }: { data: LiveData }) {
  // Compute aggregate metrics from live data
  const validSoil = data.soil.filter((s) => s.ph_value !== null);
  const avgPh =
    validSoil.length > 0
      ? (
          validSoil.reduce((s, d) => s + (d.ph_value || 0), 0) /
          validSoil.length
        ).toFixed(2)
      : "—";
  const avgN =
    validSoil.length > 0
      ? (
          validSoil.reduce((s, d) => s + (d.nitrogen_pct || 0), 0) /
          validSoil.length
        ).toFixed(3)
      : "—";
  const avgOC =
    validSoil.length > 0
      ? (
          validSoil.reduce((s, d) => s + (d.organic_carbon_pct || 0), 0) /
          validSoil.length
        ).toFixed(3)
      : "—";

  return (
    <>
      <div className="metric-strip">
        <div className="metric-card">
          <div className="metric-label">Avg pH</div>
          <div className="metric-value">{avgPh}</div>
          <div className="metric-sub">
            {Number(avgPh) >= 5.5 && Number(avgPh) <= 7.0
              ? "Optimal range"
              : "Sub-optimal"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Nitrogen</div>
          <div className="metric-value">
            {avgN}
            <span>%</span>
          </div>
          <div className="metric-sub">
            {Number(avgN) > 0.15 ? "Adequate" : "Below threshold"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Organic Carbon</div>
          <div className="metric-value">
            {avgOC}
            <span>%</span>
          </div>
          <div className="metric-sub">iSDAsoil · 0–20cm depth</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Sub-counties</div>
          <div className="metric-value">
            {data.soil.length}
            <span>/3</span>
          </div>
          <div className="metric-sub">Live iSDAsoil data</div>
        </div>
      </div>

      {data.soil.length === 0 ? (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", padding: 40, color: "var(--fg-dim)" }}
          >
            Loading soil data...
          </div>
        </div>
      ) : (
        <div className="three-col">
          {data.soil.map((d) => {
            const phPct = d.ph_value
              ? Math.min(((d.ph_value - 4) / 4) * 100, 100)
              : 0;
            const nPct = d.nitrogen_pct
              ? Math.min((d.nitrogen_pct / 0.3) * 100, 100)
              : 0;
            const ocPct = d.organic_carbon_pct
              ? Math.min((d.organic_carbon_pct / 0.5) * 100, 100)
              : 0;
            const pPct = d.phosphorous_ppm
              ? Math.min((d.phosphorous_ppm / 10) * 100, 100)
              : 0;

            return (
              <div key={d.sub_county} className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">{d.sub_county}</div>
                    <div className="panel-sub">
                      iSDAsoil · {d.observed_date}
                    </div>
                  </div>
                  <span
                    className={`badge ${soilHealthBadgeCls(d.soil_health)}`}
                  >
                    {d.soil_health}
                  </span>
                </div>
                <div className="panel-body">
                  <div className="soil-grid">
                    <div className="soil-card">
                      <div className="soil-label">pH</div>
                      <div className="soil-value">
                        {d.ph_value?.toFixed(2) ?? "—"}
                      </div>
                      <div className="soil-bar-wrap">
                        <div
                          className="soil-bar"
                          style={{
                            width: `${phPct}%`,
                            background:
                              "linear-gradient(90deg,#f0a500,#2ecc71)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="soil-card">
                      <div className="soil-label">Nitrogen</div>
                      <div className="soil-value">
                        {d.nitrogen_pct?.toFixed(3) ?? "—"}
                        <span>%</span>
                      </div>
                      <div className="soil-bar-wrap">
                        <div
                          className="soil-bar"
                          style={{
                            width: `${nPct}%`,
                            background:
                              "linear-gradient(90deg,#3a8fd4,#2ecc71)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="soil-card">
                      <div className="soil-label">Organic C</div>
                      <div className="soil-value">
                        {d.organic_carbon_pct?.toFixed(3) ?? "—"}
                        <span>%</span>
                      </div>
                      <div className="soil-bar-wrap">
                        <div
                          className="soil-bar"
                          style={{
                            width: `${ocPct}%`,
                            background:
                              "linear-gradient(90deg,#a060c8,#2ecc71)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="soil-card">
                      <div className="soil-label">Phosphorous</div>
                      <div className="soil-value">
                        {d.phosphorous_ppm?.toFixed(2) ?? "—"}
                        <span>ppm</span>
                      </div>
                      <div className="soil-bar-wrap">
                        <div
                          className="soil-bar"
                          style={{
                            width: `${pPct}%`,
                            background:
                              "linear-gradient(90deg,#a060c8,#3a8fd4)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--fg-dim)",
                      }}
                    >
                      Texture
                    </span>
                    <span className="badge badge-blue">
                      {d.texture_class || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [apiStatus, setStatus] = useState<"live" | "offline" | "loading">(
    "loading",
  );
  const [data, setData] = useState<LiveData>({
    ndvi: [],
    forecast: [],
    alerts: [],
    soil: [],
    rainfallHistory: null,
  });
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchAll = useCallback(async () => {
    setStatus("loading");
    try {
      const [ndviRes, forecastRes, alertsRes, soilRes, rainHistRes] = await Promise.all([
        fetch("/api/v1/ndvi/latest"),
        fetch("/api/v1/forecast/7day?sub_county=Lira"),
        fetch("/api/v1/alerts/active"),
        fetch("/api/v1/soil/latest"),
        fetch("/api/v1/rainfall/history?days=30"),
      ]);
      const [ndvi, forecast, alerts, soil, rainfallHistory] = await Promise.all([
        ndviRes.ok ? ndviRes.json() : [],
        forecastRes.ok ? forecastRes.json() : [],
        alertsRes.ok ? alertsRes.json() : [],
        soilRes.ok ? soilRes.json() : [],
        rainHistRes.ok ? rainHistRes.json() : null,
      ]);
      setData({ ndvi, forecast, alerts, soil, rainfallHistory });
      setStatus("live");
      setLastUpdated(
        new Date().toLocaleTimeString("en-UG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll();
    });
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const activeAlerts = data.alerts.filter((a) => a.active).length;
  const apiDot = { live: "#2ecc71", offline: "#e85d5d", loading: "#f0a500" }[
    apiStatus
  ];

  const STATUS_TEXT: Record<Screen, string> = {
    overview: lastUpdated ? `Live · Updated ${lastUpdated}` : "Connecting...",
    alerts: `${activeAlerts} Active Alert${activeAlerts !== 1 ? "s" : ""}`,
    weather: "CHIRPS + IoT Fusion",
    soil:
      data.soil.length > 0
        ? `iSDAsoil · ${data.soil.length} sub-counties · Live`
        : "PostGIS · Supabase",
    satellite: "Sentinel-2 · Landsat-8",
    forecast: "TensorFlow LSTM · 7-day horizon",
  };
  const STATUS_CLS: Partial<Record<Screen, string>> = {
    alerts: activeAlerts > 0 ? "red" : "",
    weather: "blue",
    soil: "blue",
    satellite: "blue",
  };
  const SCREEN_TITLE: Record<Screen, string> = {
    overview: "Environmental Overview",
    alerts: "Active Alerts",
    weather: "Weather & Rainfall",
    soil: "Soil Reports",
    satellite: "Satellite Imagery",
    forecast: "LSTM Rainfall Forecast",
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg
              viewBox="0 0 24 24"
              fill="#fff"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 22H5.71C6.66 19.55 7.75 17.25 9 15.17C11.07 15.85 13.4 16 16 16L21 10C18.89 9.23 17 8 17 8ZM9 13.06C9.67 11.7 10.64 10.46 12 9.3C14.09 7.58 16.5 6.5 17 6.5C17 6.5 14.24 7.19 12.5 9C11.4 10.13 10.59 11.5 9.94 13H9V13.06ZM7.5 3.5C7.5 3.5 4.5 6 4.5 10C4.5 12 5.5 13.5 5.5 13.5C5.5 13.5 5.5 11.5 6.5 10C7.17 8.94 8.5 8 8.5 8C8.5 8 7.5 6.5 7.5 3.5Z" />
            </svg>
          </div>
          <div>
            <div className="logo-name">Aeryion</div>
            <div className="logo-sub">MAAIF Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <div
            className={`nav-item${screen === "overview" ? " active" : ""}`}
            onClick={() => setScreen("overview")}
          >
            <Globe size={16} /> Overview
          </div>
          <div
            className={`nav-item${screen === "alerts" ? " active" : ""}`}
            onClick={() => setScreen("alerts")}
          >
            <TriangleAlert size={16} /> Alerts
            {activeAlerts > 0 && <div className="alert-dot" />}
          </div>
          <div className="nav-section-label">Environmental</div>
          <div
            className={`nav-item${screen === "weather" ? " active" : ""}`}
            onClick={() => setScreen("weather")}
          >
            <CloudRain size={16} /> Weather &amp; Rainfall
          </div>
          <div
            className={`nav-item${screen === "soil" ? " active" : ""}`}
            onClick={() => setScreen("soil")}
          >
            <Layers size={16} /> Soil Reports
          </div>
          <div
            className={`nav-item${screen === "satellite" ? " active" : ""}`}
            onClick={() => setScreen("satellite")}
          >
            <Satellite size={16} /> Satellite Imagery
          </div>
          <div className="nav-section-label">Intelligence</div>
          <div
            className={`nav-item${screen === "forecast" ? " active" : ""}`}
            onClick={() => setScreen("forecast")}
          >
            <Brain size={16} /> LSTM Forecast
          </div>
          <div className="nav-item">
            <MapPin size={16} /> IoT Stations
          </div>
          <div className="nav-item">
            <FileText size={16} /> Reports
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="district-chip">
            <div className="district-label">Active Region</div>
            <div className="district-name">Lango Sub-region, UG</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-title">{SCREEN_TITLE[screen]}</div>
          <span
            className={`topbar-tag${STATUS_CLS[screen] ? ` ${STATUS_CLS[screen]}` : ""}`}
          >
            {STATUS_TEXT[screen]}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: apiDot,
                boxShadow: `0 0 6px ${apiDot}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.60rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              {apiStatus === "live" ? "API" : apiStatus.toUpperCase()}
            </span>
          </div>
          <button className="btn-sm">
            <Download size={13} /> Export
          </button>
          <button className="btn-primary" onClick={fetchAll}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="content">
          {screen === "overview" && (
            <OverviewScreen go={setScreen} data={data} />
          )}
          {screen === "alerts" && <AlertsScreen data={data} />}
          {screen === "weather" && <WeatherScreen data={data} />}
          {screen === "soil" && <SoilScreen data={data} />}
          {screen === "satellite" && <SatelliteScreen data={data} />}
          {screen === "forecast" && <ForecastScreen data={data} />}
        </div>
      </main>
    </div>
  );
}
