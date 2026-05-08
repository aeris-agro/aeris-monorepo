# FILE: coltiva/backend/app/routers/auth.py
"""
Coltiva auth — phone-based OTP via Africa's Talking.

Flow:
  1. POST /api/v1/auth/request-otp { phone }
       → returns { otp_id, expires_at, is_new_user }
  2. POST /api/v1/auth/verify-otp { phone, code }
       → existing user: { access_token, refresh_token, user_profile }
       → new user:      { signup_token, requires_profile_completion: true }
  3. POST /api/v1/auth/signup-complete { signup_token, full_name, role, ... }
       → { access_token, refresh_token, user_profile }

Security:
  - 6-digit numeric codes (1M space + rate limiting + 5-attempt cap)
  - Codes expire after 10 minutes
  - Rate limit: 3 OTP requests per phone per 15 minutes
  - Codes hashed (SHA-256, phone-salted) before storage
  - Signup token: short-lived JWT signed with SUPABASE_JWT_SECRET (15min TTL)
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt as pyjwt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.db.supabase import coltiva, get_supabase
from app.services.sms import SmsClient
from app.config import settings


router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Constants ──────────────────────────────────────────────────────────────
OTP_TTL_MINUTES        = 10
OTP_MAX_ATTEMPTS       = 5
OTP_RATE_LIMIT_COUNT   = 3
OTP_RATE_LIMIT_MINUTES = 15
SIGNUP_TOKEN_TTL_MIN   = 15

_sms = SmsClient()


# ── Request / response models ──────────────────────────────────────────────
def _normalize_phone(v: str) -> str:
    v = v.strip().replace(" ", "").replace("-", "")
    if v.startswith("+2560"):
        v = "+256" + v[5:]
    if v.startswith("7") and len(v) == 9:
        v = "+256" + v
    elif v.startswith("07") and len(v) == 10:
        v = "+256" + v[1:]
    if not v.startswith("+"):
        raise ValueError("Phone must include country code (e.g. +256...)")
    if len(v) < 10 or len(v) > 16:
        raise ValueError("Phone number length invalid")
    return v


class RequestOTPBody(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def normalize(cls, v: str) -> str:
        return _normalize_phone(v)


class RequestOTPResponse(BaseModel):
    otp_id:       str
    expires_at:   datetime
    is_new_user:  bool


class VerifyOTPBody(BaseModel):
    phone: str
    code:  str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

    @field_validator("phone")
    @classmethod
    def normalize(cls, v: str) -> str:
        return _normalize_phone(v)


class UserProfile(BaseModel):
    id:                 str
    full_name:          str
    phone:              str
    role:               str
    cooperative_id:     Optional[str]
    farmer_id:          Optional[str]
    district:           Optional[str]
    sub_county_id:      Optional[str]
    preferred_language: str


class VerifyOTPResponse(BaseModel):
    access_token:                Optional[str] = None
    refresh_token:               Optional[str] = None
    user_profile:                Optional[UserProfile] = None
    signup_token:                Optional[str] = None
    requires_profile_completion: bool = False


class SignupCompleteBody(BaseModel):
    signup_token:   str
    full_name:      str = Field(..., min_length=2, max_length=120)
    role:           str = Field(..., pattern="^(farmer|cooperative_admin|field_agent)$")
    cooperative_id: Optional[str] = None
    district:       Optional[str] = None


class SignupCompleteResponse(BaseModel):
    access_token:  str
    refresh_token: str
    user_profile:  UserProfile


# ── Helpers ────────────────────────────────────────────────────────────────
def _hash_code(code: str, phone: str) -> str:
    return hashlib.sha256(f"{phone}:{code}".encode()).hexdigest()


def _verify_code(code: str, phone: str, stored_hash: str) -> bool:
    return hmac.compare_digest(_hash_code(code, phone), stored_hash)


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _check_rate_limit(phone: str) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=OTP_RATE_LIMIT_MINUTES)
    res = (
        coltiva("otp_rate_limits")
        .select("phone", count="exact")
        .eq("phone", phone)
        .gte("requested_at", cutoff.isoformat())
        .execute()
    )
    if (res.count or 0) >= OTP_RATE_LIMIT_COUNT:
        raise HTTPException(
            status_code=429,
            detail=f"Too many OTP requests. Try again in {OTP_RATE_LIMIT_MINUTES} minutes.",
        )


def _record_rate_limit(phone: str, ip: Optional[str]) -> None:
    coltiva("otp_rate_limits").insert({"phone": phone, "requester_ip": ip}).execute()


def _build_otp_message(code: str, is_new_user: bool) -> str:
    if is_new_user:
        return (
            f"Welcome to Coltiva! Your verification code is {code}. "
            f"Valid for {OTP_TTL_MINUTES} minutes. Do not share this code."
        )
    return (
        f"Coltiva login code: {code}. "
        f"Valid for {OTP_TTL_MINUTES} minutes. Do not share."
    )


def _user_exists(phone: str) -> bool:
    res = coltiva("user_profiles").select("id").eq("phone", phone).limit(1).execute()
    return bool(res.data)


def _make_signup_token(phone: str) -> str:
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured.")
    payload = {
        "phone":   phone,
        "purpose": "coltiva_signup",
        "exp":     int((datetime.now(timezone.utc) + timedelta(minutes=SIGNUP_TOKEN_TTL_MIN)).timestamp()),
    }
    return pyjwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def _verify_signup_token(token: str) -> str:
    try:
        payload = pyjwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Signup token expired. Request a new OTP.")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid signup token.")
    if payload.get("purpose") != "coltiva_signup":
        raise HTTPException(status_code=401, detail="Invalid signup token purpose.")
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(status_code=401, detail="Malformed signup token.")
    return phone


def _fetch_profile(user_id: str) -> UserProfile:
    res = coltiva("user_profiles").select("*").eq("id", user_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User profile not found.")
    p = res.data
    return UserProfile(
        id                 = p["id"],
        full_name          = p["full_name"],
        phone              = p["phone"],
        role               = p["role"],
        cooperative_id     = p.get("cooperative_id"),
        farmer_id          = p.get("farmer_id"),
        district           = p.get("district"),
        sub_county_id      = p.get("sub_county_id"),
        preferred_language = p.get("preferred_language", "en"),
    )


ACCESS_TOKEN_TTL_HOURS  = 1
REFRESH_TOKEN_TTL_DAYS  = 30


def _mint_session_tokens(user_id: str) -> dict:
    """
    Issue Supabase-compatible JWT signed with SUPABASE_JWT_SECRET.

    Supabase RLS validates JWTs by decoding with this secret and checking
    sub/role/aud claims. A token we sign here is indistinguishable from a
    Supabase-issued token — RLS policies just work.

    Refresh token is also a JWT, longer-lived, with a 'token_type' claim.
    """
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured.")

    now = datetime.now(timezone.utc)

    access_payload = {
        "sub":           user_id,
        "role":          "authenticated",
        "aud":           "authenticated",
        "iss":           "coltiva-backend",
        "iat":           int(now.timestamp()),
        "exp":           int((now + timedelta(hours=ACCESS_TOKEN_TTL_HOURS)).timestamp()),
    }
    refresh_payload = {
        "sub":           user_id,
        "token_type":    "refresh",
        "iss":           "coltiva-backend",
        "iat":           int(now.timestamp()),
        "exp":           int((now + timedelta(days=REFRESH_TOKEN_TTL_DAYS)).timestamp()),
    }

    access  = pyjwt.encode(access_payload,  settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    refresh = pyjwt.encode(refresh_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return {"access_token": access, "refresh_token": refresh}


def _issue_tokens_for_existing(phone: str) -> dict:
    """Look up the user_profile row, mint session JWTs."""
    res = coltiva("user_profiles").select("id").eq("phone", phone).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User profile missing. Contact support.")
    user_id = res.data["id"]
    tokens = _mint_session_tokens(user_id)
    tokens["user_id"] = user_id
    return tokens


# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/request-otp", response_model=RequestOTPResponse)
def request_otp(body: RequestOTPBody, request: Request) -> RequestOTPResponse:
    phone = body.phone
    ip    = request.client.host if request.client else None

    _check_rate_limit(phone)
    is_new = not _user_exists(phone)

    code    = _generate_code()
    hashed  = _hash_code(code, phone)
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)

    insert = (
        coltiva("otp_codes")
        .insert({
            "phone":        phone,
            "code_hash":    hashed,
            "purpose":      "signup" if is_new else "login",
            "expires_at":   expires.isoformat(),
            "requester_ip": ip,
        })
        .execute()
    )
    if not insert.data:
        raise HTTPException(status_code=500, detail="Failed to store OTP.")
    otp_id = insert.data[0]["id"]

    sms_result = _sms.send(phone=phone, message=_build_otp_message(code, is_new))
    if not sms_result.success:
        coltiva("otp_codes").delete().eq("id", otp_id).execute()
        raise HTTPException(
            status_code=503,
            detail=f"SMS delivery failed: {sms_result.error or 'unknown error'}",
        )

    _record_rate_limit(phone, ip)

    return RequestOTPResponse(
        otp_id      = otp_id,
        expires_at  = expires,
        is_new_user = is_new,
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(body: VerifyOTPBody) -> VerifyOTPResponse:
    phone = body.phone
    code  = body.code

    now_iso = datetime.now(timezone.utc).isoformat()
    res = (
        coltiva("otp_codes")
        .select("*")
        .eq("phone", phone)
        .is_("used_at", "null")
        .gte("expires_at", now_iso)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=400, detail="No active OTP for this phone. Request a new one.")
    otp = res.data[0]

    if otp["attempts"] >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")

    if not _verify_code(code, phone, otp["code_hash"]):
        coltiva("otp_codes").update({"attempts": otp["attempts"] + 1}).eq("id", otp["id"]).execute()
        raise HTTPException(status_code=400, detail="Invalid code.")

    coltiva("otp_codes").update({"used_at": now_iso}).eq("id", otp["id"]).execute()

    if _user_exists(phone):
        sess = _issue_tokens_for_existing(phone)
        coltiva("user_profiles").update({"last_login_at": now_iso}).eq("phone", phone).execute()
        profile = _fetch_profile(sess["user_id"])
        return VerifyOTPResponse(
            access_token  = sess["access_token"],
            refresh_token = sess["refresh_token"],
            user_profile  = profile,
        )

    return VerifyOTPResponse(
        signup_token                = _make_signup_token(phone),
        requires_profile_completion = True,
    )


@router.post("/signup-complete", response_model=SignupCompleteResponse)
def signup_complete(body: SignupCompleteBody) -> SignupCompleteResponse:
    phone = _verify_signup_token(body.signup_token)

    if _user_exists(phone):
        raise HTTPException(status_code=409, detail="An account already exists for this phone.")

    sb = get_supabase()
    pseudo_email = f"{phone.lstrip('+')}@coltiva.local"

    create_res = sb.auth.admin.create_user({
        "email":         pseudo_email,
        "email_confirm": True,
        "user_metadata": {"phone": phone, "signup_via": "coltiva_otp"},
    })
    user = create_res.user if hasattr(create_res, "user") else create_res
    user_id = user.id

    coltiva("user_profiles").insert({
        "id":             user_id,
        "full_name":      body.full_name.strip(),
        "phone":          phone,
        "role":           body.role,
        "cooperative_id": body.cooperative_id,
        "district":       body.district,
    }).execute()

    tokens  = _mint_session_tokens(user_id)
    profile = _fetch_profile(user_id)
    return SignupCompleteResponse(
        access_token  = tokens["access_token"],
        refresh_token = tokens["refresh_token"],
        user_profile  = profile,
    )
