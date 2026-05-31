from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user

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
    def override_get_current_user():
        return {"sub": "testuser", "email": "test@example.com"}

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        response = client.get("/profile")
        assert response.status_code == 200
        assert response.json() == {"user_id": "testuser", "email": "test@example.com"}
    finally:
        app.dependency_overrides = {}