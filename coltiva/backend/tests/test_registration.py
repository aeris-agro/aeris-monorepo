import jwt
import pytest
from fastapi import HTTPException

from app.routers import auth

JWT_SECRET = "unit-test-secret-with-at-least-32-bytes"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("0700 000 000", "+256700000000"),
        ("700-000-000", "+256700000000"),
        ("+2560700000000", "+256700000000"),
        ("+256700000000", "+256700000000"),
    ],
)
def test_normalize_ugandan_phone_numbers(raw, expected):
    assert auth._normalize_phone(raw) == expected


def test_normalize_phone_rejects_missing_country_code():
    with pytest.raises(ValueError):
        auth._normalize_phone("123")


def test_otp_hash_verification_is_phone_scoped():
    stored = auth._hash_code("123456", "+256700000000")

    assert auth._verify_code("123456", "+256700000000", stored)
    assert not auth._verify_code("123456", "+256711111111", stored)
    assert not auth._verify_code("654321", "+256700000000", stored)


def test_signup_token_roundtrip(monkeypatch):
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", JWT_SECRET)

    token = auth._make_signup_token("+256700000000")

    assert auth._verify_signup_token(token) == "+256700000000"


def test_signup_token_rejects_wrong_purpose(monkeypatch):
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", JWT_SECRET)
    token = jwt.encode({"phone": "+256700000000", "purpose": "other"}, JWT_SECRET, algorithm="HS256")

    with pytest.raises(HTTPException) as exc:
        auth._verify_signup_token(token)

    assert exc.value.status_code == 401


def test_session_tokens_include_supabase_claims(monkeypatch):
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", JWT_SECRET)

    tokens = auth._mint_session_tokens("user-123")
    access = jwt.decode(tokens["access_token"], JWT_SECRET, algorithms=["HS256"], audience="authenticated")
    refresh = jwt.decode(tokens["refresh_token"], JWT_SECRET, algorithms=["HS256"])

    assert access["sub"] == "user-123"
    assert access["role"] == "authenticated"
    assert access["aud"] == "authenticated"
    assert refresh["token_type"] == "refresh"
