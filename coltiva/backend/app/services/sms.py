# FILE: coltiva/backend/app/services/sms.py
"""
Africa's Talking SMS service.

Sandbox docs: https://developers.africastalking.com/docs/sms/sending/sandbox
Production:  https://developers.africastalking.com/docs/sms/sending/python
"""

import httpx
from typing import Optional

from app.config import settings

# Endpoint differs between sandbox and live
SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"
LIVE_URL = "https://api.africastalking.com/version1/messaging"


class SmsResult:
    """Lightweight result object returned by SmsClient.send()."""

    def __init__(
        self,
        success: bool,
        provider_msg_id: Optional[str] = None,
        status: str = "pending",
        cost: Optional[str] = None,
        error: Optional[str] = None,
    ):
        self.success = success
        self.provider_msg_id = provider_msg_id
        self.status = status
        self.cost = cost
        self.error = error


class SmsClient:
    def __init__(self):
        self.username = settings.AT_USERNAME
        self.api_key = settings.AT_API_KEY
        self.sender = settings.AT_SHORTCODE or None
        self.url = SANDBOX_URL if self.username == "sandbox" else LIVE_URL

    def is_configured(self) -> bool:
        return bool(self.username and self.api_key)

    def send(self, phone: str, message: str) -> SmsResult:
        """
        Send a single SMS to one recipient.

        AT enforces a 160-character soft limit per part. Long messages are
        split into multi-part SMS and billed accordingly. We trim to 320 chars
        (2 parts max) for safety.
        """
        if not self.is_configured():
            return SmsResult(success=False, error="AT credentials missing", status="failed")

        if len(message) > 320:
            message = message[:317] + "..."

        payload = {
            "username": self.username,
            "to": phone,
            "message": message,
        }
        if self.sender:
            payload["from"] = self.sender

        headers = {
            "apiKey": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.post(self.url, data=payload, headers=headers)

            if r.status_code != 201:
                return SmsResult(
                    success=False,
                    status="failed",
                    error=f"HTTP {r.status_code}: {r.text[:200]}",
                )

            data = r.json()
            recipients = data.get("SMSMessageData", {}).get("Recipients", [])
            if not recipients:
                return SmsResult(
                    success=False,
                    status="failed",
                    error=data.get("SMSMessageData", {}).get("Message", "no recipients"),
                )

            rec = recipients[0]
            ok = rec.get("status") == "Success"

            return SmsResult(
                success=ok,
                provider_msg_id=rec.get("messageId"),
                status="sent" if ok else "failed",
                cost=rec.get("cost"),
                error=None if ok else rec.get("status"),
            )

        except (httpx.HTTPError, httpx.TimeoutException) as e:
            return SmsResult(success=False, status="failed", error=str(e)[:200])


# Module-level singleton
client = SmsClient()
