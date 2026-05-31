from datetime import datetime, timedelta, timezone
from unittest.mock import patch
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.auth import get_current_user
from tests.conftest import TEST_PUBLIC_KEY

TEST_PRIVATE_KEY="""-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgStCKiPlZthAAK3Yy
DcIDx1mV6tNEdTbxmxkRRJiSoDOhRANCAARPU4/a8F6mY09wZtbcMWJuDJNDAdvR
AghTjEd2S9keRqG4MuQboexdFt7bN6XNvlrrnn0CUZeslluH1z77ZTSv
-----END PRIVATE KEY-----"""

# Helper functions to create test tokens and credentials
def make_token(sub="test", email="test@example.com", expired=False, key=TEST_PRIVATE_KEY):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "iat": now,
        "exp": now - timedelta(hours=1) if expired else now + timedelta(hours=1),
        "aud": "authenticated"
    }
    return jwt.encode(payload, key, algorithm="ES256")

def make_credentials(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

# Tests
def test_valid_token_returns_payload():
    token = make_token(sub="user123", email="user123@example.com")
    with patch("app.auth.settings") as mock_settings:
        mock_settings.supabase_public_key = {"keys": [TEST_PUBLIC_KEY]}
        result = get_current_user(make_credentials(token))
    assert result["sub"] == "user123"
    assert result["email"] == "user123@example.com"

def test_expired_token_raises_401():
    token = make_token(expired=True)
    with patch("app.auth.settings") as mock_settings:
        mock_settings.supabase_public_key = {"keys": [TEST_PUBLIC_KEY]}
        with pytest.raises(HTTPException) as exc:
            get_current_user(make_credentials(token))
    assert exc.value.status_code == 401

def test_wrong_signing_key_raises_401():
    # Create a token signed with a different key
    other_key = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgZ58XgbWZu5OkKl8j
xA3NtwkpZ/+6IUamoD7tp+m+AKKhRANCAARmK/NVLEfg54iVjq8tyhTfNSzVmlQv
Z6TkjDny1ZrwLTY1KUyzD0K/IEmaXlWxJZ+oOdNSMnmMzuB7Zsij9HAS
-----END PRIVATE KEY-----"""
    token = make_token(key=other_key)
    with patch("app.auth.settings") as mock_settings:
        mock_settings.supabase_public_key = {"keys": [TEST_PUBLIC_KEY]}
        with pytest.raises(HTTPException) as exc:
            get_current_user(make_credentials(token))
    assert exc.value.status_code == 401


def test_malformed_token_raises_401():
    with patch("app.auth.settings") as mock_settings:
        mock_settings.supabase_public_key = {"keys": [TEST_PUBLIC_KEY]}
        with pytest.raises(HTTPException) as exc:
            get_current_user(make_credentials("malformed.jwt"))
    assert exc.value.status_code == 401