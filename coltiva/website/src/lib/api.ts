/**
 * Coltiva auth API client.
 *
 * All calls go through Next.js's /api/v1/* rewrite, which proxies to the
 * Coltiva backend at process.env.NEXT_PUBLIC_COLTIVA_API_URL. This keeps
 * the backend URL out of the browser and makes CORS a non-issue in dev.
 */

const API_BASE = "/api/v1";

// ── Response shapes ────────────────────────────────────────────────────────
export interface RequestOTPResponse {
  otp_id:      string;
  expires_at:  string;
  is_new_user: boolean;
}

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

export interface VerifyOTPResponse {
  access_token:                string | null;
  refresh_token:               string | null;
  user_profile:                UserProfile | null;
  signup_token:                string | null;
  requires_profile_completion: boolean;
}

export interface SignupCompleteResponse {
  access_token:  string;
  refresh_token: string;
  user_profile:  UserProfile;
}

// ── API errors ─────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, "The server returned an invalid response.");
  }

  if (!res.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail);
  }

  return data as T;
}

// ── Public API ─────────────────────────────────────────────────────────────
export function requestOtp(phone: string) {
  return call<RequestOTPResponse>("/auth/request-otp", { phone });
}

export function verifyOtp(phone: string, code: string) {
  return call<VerifyOTPResponse>("/auth/verify-otp", { phone, code });
}

export function signupComplete(params: {
  signup_token:    string;
  full_name:       string;
  role:            "farmer" | "cooperative_admin" | "field_agent";
  cooperative_id?: string;
  district?:       string;
}) {
  return call<SignupCompleteResponse>("/auth/signup-complete", params);
}
