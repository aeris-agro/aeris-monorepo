import { NextRequest, NextResponse } from "next/server";
import { insertKycLead } from "@/lib/supabase";

interface FaqPayload {
  name?: unknown;
  email?: unknown;
  question?: unknown;
  website?: unknown;
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

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getSubmittedIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0].trim() || realIp || "unknown";
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
  let raw: FaqPayload;
  try {
    raw = (await req.json()) as FaqPayload;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const submittedIp = getSubmittedIp(req);
  const userAgent = req.headers.get("user-agent");

  if (isRateLimited(submittedIp)) {
    return NextResponse.json(
      { detail: "Too many submissions. Please try again later or email hello@aerisagro.com." },
      { status: 429 },
    );
  }

  if (asString(raw.website).length > 0) {
    return NextResponse.json({ detail: "Submission accepted" }, { status: 202 });
  }

  const formStartedAt = asNumber(raw.form_started_at);
  if (!formStartedAt || Date.now() - formStartedAt < MIN_FORM_TIME_MS) {
    return NextResponse.json({ detail: "Please take a moment before sending." }, { status: 400 });
  }

  const name = asString(raw.name);
  const email = asString(raw.email);
  const question = asString(raw.question);

  const errors: string[] = [];
  if (name.length < 2 || name.length > 120) errors.push("name is required");
  if (!EMAIL_RE.test(email)) errors.push("email is invalid");
  if (question.length < 10 || question.length > 2000) errors.push("question must be 10-2000 characters");

  if (errors.length) {
    return NextResponse.json({ detail: errors.join("; ") }, { status: 400 });
  }

  try {
    const { id } = await insertKycLead({
      full_name: name,
      email,
      phone: "FAQ",
      country: "Uganda",
      category: "development_partner",
      message: `FAQ question/comment:\n\n${question}`,
      submitted_ip: submittedIp === "unknown" ? null : submittedIp,
      user_agent: userAgent,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("FAQ question insert failed:", err);
    return NextResponse.json(
      { detail: "Could not save your question. Please try again or email hello@aerisagro.com." },
      { status: 500 },
    );
  }
}
