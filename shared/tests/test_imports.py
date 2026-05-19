def test_shared_packages_import():
    import shared
    import shared.db
    import shared.events
    import shared.models
    import shared.utils

    assert shared is not None
