from datetime import date, timedelta

from app.routers import planting


def test_expected_ndvi_tracks_crop_growth_stage():
    assert planting.expected_ndvi("maize", 5) == (0.20, 0.40)
    assert planting.expected_ndvi("maize", 40) == (0.45, 0.75)
    assert planting.expected_ndvi("maize", 80) == (0.55, 0.85)
    assert planting.expected_ndvi("maize", 110) == (0.30, 0.60)


def test_build_advisories_flags_crop_stress_and_heavy_rain(monkeypatch):
    planted_at = (date.today() - timedelta(days=40)).isoformat()

    monkeypatch.setattr(
        planting.aeryion_client,
        "get_ndvi_for_sub_county",
        lambda _name: {"ndvi_mean": 0.30},
    )
    monkeypatch.setattr(
        planting.aeryion_client,
        "get_soil_for_sub_county",
        lambda _name: {"ph_value": 5.0},
    )
    monkeypatch.setattr(
        planting.aeryion_client,
        "get_forecast_for_sub_county",
        lambda _name: [{"rainfall_mm": 20}, {"rainfall_mm": 35}],
    )

    advisories, metadata = planting.build_advisories(
        {"crop_type": "maize", "planted_at": planted_at},
        "Lira",
    )

    titles = {item.title for item in advisories}
    assert "Crop stress detected (maize)" in titles
    assert "Heavy rainfall forecast" in titles
    assert "Acidic soil" in titles
    assert metadata["forecast_7d_mm"] == 55


def test_format_sms_truncates_long_advisory():
    advisory = planting.AdvisoryItem(
        category="rainfall",
        severity="warning",
        title="Heavy rainfall forecast",
        body="Rain " * 100,
        action="Clear drains " * 50,
    )

    message = planting.format_sms(advisory, "Jane Farmer", "maize")

    assert message.startswith("AERIS: Hi Jane.")
    assert len(message) == 320
    assert message.endswith("...")
