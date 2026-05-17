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

interface ApiPayload {
  full_name?:    unknown;
  email?:        unknown;
  phone?:        unknown;
  country?:      unknown;
  district?:     unknown;
  organisation?: unknown;
  category?:     unknown;
  message?:      unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

export async function POST(req: NextRequest) {
  let raw: ApiPayload;
  try {
    raw = (await req.json()) as ApiPayload;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const fullName = asString(raw.full_name);
  const email    = asString(raw.email);
  const phone    = asString(raw.phone);
  const country  = asString(raw.country);
  const category = asString(raw.category);

  const errors: string[] = [];
  if (fullName.length < 2 || fullName.length > 120) errors.push("full name must be 2-120 chars");
  if (!EMAIL_RE.test(email))                        errors.push("email is invalid");
  if (phone.length < 5 || phone.length > 32)        errors.push("phone is invalid");
  if (country.length < 2)                           errors.push("country is required");
  if (!CATEGORIES.includes(category as KycCategory)) {
    errors.push("category is invalid");
  }

  if (errors.length) {
    return NextResponse.json({ detail: errors.join("; ") }, { status: 400 });
  }

  // Capture request metadata for spam detection / lead context
  const forwardedFor = req.headers.get("x-forwarded-for");
  const submittedIp  = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  const userAgent    = req.headers.get("user-agent");

  try {
    const { id } = await insertKycLead({
      full_name:    fullName,
      email:        email,
      phone:        phone,
      country:      country,
      category:     category as KycCategory,
      district:     asNullableString(raw.district),
      organisation: asNullableString(raw.organisation),
      message:      asNullableString(raw.message),
      submitted_ip: submittedIp,
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
