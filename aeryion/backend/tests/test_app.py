import importlib


def test_app_imports_with_expected_routes(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("GCS_BUCKET_NAME", "test-bucket")

    main = importlib.import_module("app.main")
    paths = {route.path for route in main.app.routes}

    assert "/health" in paths
    assert "/v1/ndvi/latest" in paths
