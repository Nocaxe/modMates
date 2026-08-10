from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.database import get_db
from app.main import app
from app.models import Profile

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_profile_no_token():
    response = client.get("/profile")
    assert response.status_code == 401

def test_profile_bad_token():
    response = client.get("/profile", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401

def test_profile_authenticated():
    mock_profile = MagicMock(spec=Profile)
    mock_profile.user_id = "testuser"
    mock_profile.email = "test@example.com"
    mock_profile.display_name = None

    db = MagicMock()
    db.get.return_value = mock_profile

    def override_get_db():
        yield db

    app.dependency_overrides[get_current_user] = lambda: {"sub": "testuser", "email": "test@example.com"}
    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.get("/profile")
        assert response.status_code == 200
        assert response.json() == {"user_id": "testuser", "email": "test@example.com", "display_name": None}
    finally:
        app.dependency_overrides = {}