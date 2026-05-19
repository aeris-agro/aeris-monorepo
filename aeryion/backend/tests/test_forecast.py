import importlib
from datetime import date, timedelta

import pytest
from fastapi import HTTPException


class Result:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, data):
        self.data = data

    def select(self, *_args):
        return self

    def eq(self, *_args):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args):
        return self

    def execute(self):
        return Result(self.data)


def load_forecast(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("GCS_BUCKET_NAME", "test-bucket")
    return importlib.import_module("app.routers.forecast")


def test_7day_forecast_uses_latest_rainfall_anomaly(monkeypatch):
    forecast = load_forecast(monkeypatch)

    monkeypatch.setattr(
        forecast,
        "shared",
        lambda _table: Query([{"id": "sc-lira", "name": "Lira"}]),
    )
    monkeypatch.setattr(
        forecast,
        "aeryion",
        lambda _table: Query(
            [{"rainfall_mm": 90, "anomaly_pct": 50, "observation_date": "2026-05-18"}]
        ),
    )

    result = forecast.get_7day_forecast("Lira")

    assert len(result) == 7
    assert result[0].date == date.today() + timedelta(days=1)
    assert result[0].rainfall_mm == 1.26
    assert result[-1].confidence_pct == 64.0


def test_7day_forecast_returns_404_for_unknown_subcounty(monkeypatch):
    forecast = load_forecast(monkeypatch)
    monkeypatch.setattr(
        forecast, "shared", lambda _table: Query([{"id": "sc-lira", "name": "Lira"}])
    )

    with pytest.raises(HTTPException) as exc:
        forecast.get_7day_forecast("Dokolo")

    assert exc.value.status_code == 404
