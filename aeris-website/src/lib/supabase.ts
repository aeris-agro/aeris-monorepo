/**
 * Server-side Supabase REST helper for KYC lead submission.
 *
 * Inserts into `shared.kyc_leads`. Uses SUPABASE_SERVICE_KEY (never
 * exposed to the browser) so we don't have to configure RLS for anon
 * INSERT. The /api/kyc/lead route is the only entry point that calls
 * this.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY ?? "";

export type KycCategory =
  | "farmer_cooperative"
  | "investor"
  | "government_partner"
  | "commodity_buyer"
  | "input_supplier"
  | "development_partner";

export interface KycLeadInsert {
  full_name:    string;
  email:        string;
  phone:        string;
  country:      string;
  category:     KycCategory;
  district?:    string | null;
  organisation?:string | null;
  message?:     string | null;
  submitted_ip?:string | null;
  user_agent?:  string | null;
}

export async function insertKycLead(payload: KycLeadInsert): Promise<{ id: string }> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase server credentials not configured");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/kyc_leads`, {
    method:  "POST",
    headers: {
      "apikey":         SERVICE_KEY,
      "Authorization":  `Bearer ${SERVICE_KEY}`,
      "Content-Type":   "application/json",
      "Content-Profile":"shared",
      "Prefer":         "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${text}`);
  }

  const rows = (await res.json()) as Array<{ id: string }>;
  return { id: rows[0].id };
}
