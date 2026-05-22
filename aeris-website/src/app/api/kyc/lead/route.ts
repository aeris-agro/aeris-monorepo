import { NextRequest, NextResponse } from "next/server";
import { insertKycLead, type KycCategory } from "@/lib/supabase";

const CATEGORIES: KycCategory[] = [
  "farmer_cooperative",
  "investor",
  "government_partner",
  "commodity_buyer",
  "input_supplier",
  "development_partner",
];

const INTERESTS = new Map([
  ["investment",             "Investment"],
  ["government_deployment",  "Public-sector program"],
  ["commodity_sourcing",     "Commodity sourcing"],
  ["cooperative_onboarding", "Farmer or cooperative support"],
  ["data_research",          "Research partnership"],
]);

interface ApiPayload {
  full_name?:    unknown;
  email?:        unknown;
  phone?:        unknown;
  country?:      unknown;
  district?:     unknown;
  organisation?: unknown;
  category?:     unknown;
  interest?:     unknown;
  message?:      unknown;
  website?:      unknown;
  form_started_at?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FORM_TIME_MS = 2500;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getSubmittedIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0].trim() || realIp || "unknown";
}

function formatLeadMessage(interest: string, message: string | null): string {
  const interestLabel = INTERESTS.get(interest) ?? interest;
  return [`Interest: ${interestLabel}`, message].filter(Boolean).join("\n\n");
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  let raw: ApiPayload;
  try {
    raw = (await req.json()) as ApiPayload;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  // Capture request metadata for spam detection / lead context
  const submittedIp = getSubmittedIp(req);
  const userAgent   = req.headers.get("user-agent");

  if (isRateLimited(submittedIp)) {
    return NextResponse.json(
      { detail: "Too many submissions. Please try again later or email hello@aerisagro.com." },
      { status: 429 },
    );
  }

  // Bot trap: humans never see or fill this field.
  if (asString(raw.website).length > 0) {
    return NextResponse.json({ detail: "Submission accepted" }, { status: 202 });
  }

  const formStartedAt = asNumber(raw.form_started_at);
  if (!formStartedAt || Date.now() - formStartedAt < MIN_FORM_TIME_MS) {
    return NextResponse.json({ detail: "Please take a moment to complete the form." }, { status: 400 });
  }

  // Validate required fields
  const fullName = asString(raw.full_name);
  const email    = asString(raw.email);
  const phone    = asString(raw.phone);
  const country  = asString(raw.country);
  const category = asString(raw.category);
  const interest = asString(raw.interest);

  const errors: string[] = [];
  if (fullName.length < 2 || fullName.length > 120) errors.push("full name must be 2-120 chars");
  if (!EMAIL_RE.test(email))                        errors.push("email is invalid");
  if (phone.length < 5 || phone.length > 32)        errors.push("phone is invalid");
  if (country.length < 2)                           errors.push("country is required");
  if (!CATEGORIES.includes(category as KycCategory)) {
    errors.push("category is invalid");
  }
  if (!INTERESTS.has(interest))                         errors.push("interest is invalid");

  if (errors.length) {
    return NextResponse.json({ detail: errors.join("; ") }, { status: 400 });
  }

  try {
    const { id } = await insertKycLead({
      full_name:    fullName,
      email:        email,
      phone:        phone,
      country:      country,
      category:     category as KycCategory,
      district:     asNullableString(raw.district),
      organisation: asNullableString(raw.organisation),
      message:      formatLeadMessage(interest, asNullableString(raw.message)),
      submitted_ip: submittedIp === "unknown" ? null : submittedIp,
      user_agent:   userAgent,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("KYC lead insert failed:", err);
    return NextResponse.json(
      { detail: "Could not save your submission. Please try again or email hello@aerisagro.com." },
      { status: 500 },
    );
  }
}
