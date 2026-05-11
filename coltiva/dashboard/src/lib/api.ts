/**
 * Authenticated API client for the Coltiva backend.
 *
 * Every request automatically attaches the Bearer token. On 401, redirects
 * to the website's login page (no auth refresh logic for now — Trello card
 * doesn't require it; can add later).
 */

import { getAccessToken, redirectToLogin } from "@/lib/session";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = "ApiError";
  }
}

interface CallOpts {
  method?:  "GET" | "POST" | "PATCH" | "DELETE";
  body?:    unknown;
  authed?:  boolean;  // default true
}

async function call<T>(path: string, opts: CallOpts = {}): Promise<T> {
  const { method = "GET", body, authed = true } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authed) {
    const token = getAccessToken();
    if (!token) {
      redirectToLogin();
      throw new ApiError(401, "Not authenticated");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError(401, "Session expired");
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, "Invalid server response");
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

export const api = {
  get:    <T>(path: string)              => call<T>(path),
  post:   <T>(path: string, body: unknown) => call<T>(path, { method: "POST",  body }),
  patch:  <T>(path: string, body: unknown) => call<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string)              => call<T>(path, { method: "DELETE" }),
};
