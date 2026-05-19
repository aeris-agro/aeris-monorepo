from app.services.sms import SmsClient


class Response:
    status_code = 201

    def json(self):
        return {
            "SMSMessageData": {
                "Recipients": [
                    {
                        "status": "Success",
                        "messageId": "sms-123",
                        "cost": "UGX 32.0",
                    }
                ]
            }
        }


class FakeHttpClient:
    def __init__(self, timeout):
        self.timeout = timeout

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def post(self, url, data, headers):
        self.url = url
        self.data = data
        self.headers = headers
        return Response()


def test_sms_client_reports_missing_credentials():
    client = SmsClient()
    client.username = ""
    client.api_key = ""

    result = client.send("+256700000000", "Hello")

    assert not result.success
    assert result.status == "failed"
    assert result.error == "AT credentials missing"


def test_sms_client_sends_configured_message(monkeypatch):
    monkeypatch.setattr("app.services.sms.httpx.Client", FakeHttpClient)
    client = SmsClient()
    client.username = "sandbox"
    client.api_key = "key"
    client.sender = None

    result = client.send("+256700000000", "Hello")

    assert result.success
    assert result.status == "sent"
    assert result.provider_msg_id == "sms-123"
    assert result.cost == "UGX 32.0"
