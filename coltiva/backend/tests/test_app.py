from app.main import app


def test_app_imports_with_expected_routes():
    paths = {route.path for route in app.routes}

    assert "/api/v1/health" in paths
    assert "/api/v1/auth/request-otp" in paths
