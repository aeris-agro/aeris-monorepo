/**
 * Session management for the Coltiva dashboard.
 *
 * On first load, the dashboard receives access_token + refresh_token in the
 * URL fragment (e.g. /#access_token=eyJ...&refresh_token=eyJ...) — sent by
 * the website's verify-otp flow. This module:
 *
 *   1. Reads tokens from the fragment (if present)
 *   2. Persists them to localStorage
 *   3. Strips the fragment from the URL (so they're not in browser history)
 *   4. Provides typed accessors for downstream code
 */

const KEY_ACCESS  = "coltiva_access_token";
const KEY_REFRESH = "coltiva_refresh_token";
const KEY_PROFILE = "coltiva_user_profile";

export interface UserProfile {
  id:                 string;
  full_name:          string;
  phone:              string;
  role:               "farmer" | "cooperative_admin" | "field_agent" | "aeris_staff";
  cooperative_id:     string | null;
  farmer_id:          string | null;
  district:           string | null;
  sub_county_id:      string | null;
  preferred_language: "en" | "luo";
}

/**
 * Decode a JWT payload. Used for client-side display only; never trust this
 * for authorization (server validates signatures).
 */
function decodeJwt<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const padded  = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json    = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Inspect the access_token's `exp` claim. Returns true if expired. */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
}

/**
 * Capture tokens from the URL fragment if present.
 * Run this once on app mount, ideally in a top-level Client Component.
 * Strips the fragment so tokens don't linger in browser history.
 */
export function captureTokensFromFragment() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access  = params.get("access_token");
  const refresh = params.get("refresh_token");

  if (access && refresh) {
    localStorage.setItem(KEY_ACCESS,  access);
    localStorage.setItem(KEY_REFRESH, refresh);

    // Decode optional user_profile from fragment (sent by website's
    // verify-otp redirect since localStorage is per-origin)
    const profileB64 = params.get("user_profile");
    if (profileB64) {
      try {
        const json = decodeURIComponent(escape(atob(profileB64)));
        const profile = JSON.parse(json) as UserProfile;
        localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
      } catch {
        // Bad payload — ignore. AuthGate will redirect to login if profile
        // is missing when pages need it.
      }
    }

    // Strip fragment without triggering a navigation
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_REFRESH);
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setUserProfile(p: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_PROFILE, JSON.stringify(p));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_PROFILE);
}

/** Boolean: do we have a non-expired access token? */
export function isAuthenticated(): boolean {
  const t = getAccessToken();
  return !!t && !isTokenExpired(t);
}

/** Redirect to the marketing site's login page. */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const websiteUrl =
    process.env.NEXT_PUBLIC_COLTIVA_WEBSITE_URL ?? "http://localhost:3002";
  window.location.href = `${websiteUrl}/login`;
}
