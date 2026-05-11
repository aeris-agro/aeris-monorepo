"use client";

import { useEffect, useState } from "react";
import {
  captureTokensFromFragment,
  getUserProfile,
  isAuthenticated,
  redirectToLogin,
} from "@/lib/session";

/**
 * Top-level auth wrapper. Wraps every page.
 *
 *   1. Captures access_token + refresh_token from URL fragment (handoff
 *      from website's verify-otp redirect)
 *   2. Checks for a non-expired access_token in localStorage
 *   3. If absent/expired → redirect to website login
 *   4. Otherwise → render children
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Step 1: pick up tokens if we're being redirected from /verify
    captureTokensFromFragment();

    // Step 2: gate
    if (!isAuthenticated() || !getUserProfile()) {
      redirectToLogin();
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          minHeight:      "100vh",
        }}
      >
        <span className="aeris-spinner" />
      </div>
    );
  }

  return <>{children}</>;
}
