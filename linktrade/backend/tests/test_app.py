from app.main import app


def test_app_registers_current_api_routes():
    paths = {route.path for route in app.routes}

    assert "/api/v1/health" in paths
    assert "/docs" in paths
    assert "/redoc" in paths


def test_placeholder_routers_do_not_expose_trade_endpoints_yet():
    paths = {route.path for route in app.routes}

    assert "/api/v1/orders" not in paths
    assert "/api/v1/listings" not in paths
