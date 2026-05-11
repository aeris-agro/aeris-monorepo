/**
 * Session storage helpers.
 *
 * Tokens are stored in localStorage so the dashboard (a separate Next app
 * on the same eTLD+1) can read them. For production, both apps will live
 * under .aeris.agro so localStorage isn't shared automatically — we'll
 * pass tokens via URL fragment on the redirect (#access_token=...) and
 * the dashboard will read them on first load.
 */

import type { UserProfile } from "@/lib/api";

const KEY_ACCESS  = "coltiva_access_token";
const KEY_REFRESH = "coltiva_refresh_token";
const KEY_PROFILE = "coltiva_user_profile";
const KEY_PHONE   = "coltiva_pending_phone";    // for /verify and /signup pages

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_COLTIVA_DASHBOARD_URL ?? "http://localhost:3003";

export function saveSession(
  access:  string,
  refresh: string,
  profile: UserProfile,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_ACCESS,  access);
  localStorage.setItem(KEY_REFRESH, refresh);
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const access  = localStorage.getItem(KEY_ACCESS);
  const refresh = localStorage.getItem(KEY_REFRESH);
  const profile = localStorage.getItem(KEY_PROFILE);
  if (!access || !refresh || !profile) return null;
  try {
    return {
      access_token:  access,
      refresh_token: refresh,
      user_profile:  JSON.parse(profile) as UserProfile,
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_PROFILE);
}

export function setPendingPhone(phone: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY_PHONE, phone);
}

export function getPendingPhone(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY_PHONE);
}

export function clearPendingPhone() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY_PHONE);
}

/**
 * Redirect to the Coltiva dashboard. Tokens + profile are passed via URL
 * fragment so they're not logged in browser history or sent to the backend
 * in headers. The dashboard reads them on first load (different origin =
 * separate localStorage, so we can't share it directly).
 */
export function redirectToDashboard(
  access:  string,
  refresh: string,
  profile: UserProfile,
) {
  // Encode profile as base64 so it survives URL fragment safely
  const profileB64 =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(JSON.stringify(profile))))
      : "";

  const fragment = new URLSearchParams({
    access_token:  access,
    refresh_token: refresh,
    user_profile:  profileB64,
  }).toString();

  window.location.href = `${DASHBOARD_URL}/#${fragment}`;
}
