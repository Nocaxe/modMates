'''Tests for GET /timetable and PUT /timetable endpoints.'''
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user
from app.database import get_db
from app.models import UserTimetable

client = TestClient(app)

SAMPLE_SELECTION = {
    "CS2103T": {"Lecture": "1", "Tutorial": "01"},
    "CS2040S": {"Lecture": "1", "Tutorial": "01", "Laboratory": "01"},
}
SAMPLE_LOCKED = ["CS2103T|Tutorial"]


def make_user(sub="user-abc", email="user@example.com"):
    return {"sub": sub, "email": email}


def setup_overrides(user=None, db=None):
    if user is not None:
        app.dependency_overrides[get_current_user] = lambda: user
    if db is not None:
        def db_override():
            yield db
        app.dependency_overrides[get_db] = db_override


def clear_overrides():
    app.dependency_overrides = {}


# GET /timetable 

def test_get_timetable_requires_auth():
    response = client.get("/timetable")
    assert response.status_code == 401


def test_get_timetable_returns_empty_defaults_when_no_row_exists():
    db = MagicMock()
    db.get.return_value = None

    setup_overrides(user=make_user(), db=db)
    try:
        response = client.get("/timetable")
        assert response.status_code == 200
        assert response.json() == {"selection": {}, "locked": [], "modules": [], "skipped": [], "constraints": []}
    finally:
        clear_overrides()


def test_get_timetable_returns_saved_selection_and_locked():
    row = MagicMock(spec=UserTimetable)
    row.selection = SAMPLE_SELECTION
    row.locked = SAMPLE_LOCKED

    db = MagicMock()
    db.get.return_value = row

    setup_overrides(user=make_user(), db=db)
    try:
        response = client.get("/timetable")
        assert response.status_code == 200
        data = response.json()
        assert data["selection"] == SAMPLE_SELECTION
        assert data["locked"] == SAMPLE_LOCKED
    finally:
        clear_overrides()


def test_get_timetable_queries_by_user_sub():
    db = MagicMock()
    db.get.return_value = None

    setup_overrides(user=make_user(sub="specific-user-id"), db=db)
    try:
        client.get("/timetable")
        db.get.assert_called_once_with(UserTimetable, "specific-user-id")
    finally:
        clear_overrides()


# PUT /timetable

def test_save_timetable_requires_auth():
    response = client.put("/timetable", json={"selection": {}, "locked": []})
    assert response.status_code == 401


def test_save_timetable_returns_204():
    db = MagicMock()
    db.get.return_value = None

    setup_overrides(user=make_user(), db=db)
    try:
        response = client.put(
            "/timetable",
            json={"selection": SAMPLE_SELECTION, "locked": SAMPLE_LOCKED},
        )
        assert response.status_code == 204
    finally:
        clear_overrides()


def test_save_timetable_creates_new_row_when_none_exists():
    db = MagicMock()
    db.get.return_value = None

    setup_overrides(user=make_user(sub="new-user"), db=db)
    try:
        client.put(
            "/timetable",
            json={"selection": SAMPLE_SELECTION, "locked": SAMPLE_LOCKED},
        )

        db.add.assert_called_once()
        db.commit.assert_called_once()

        added_row = db.add.call_args[0][0]
        assert added_row.user_id == "new-user"
        assert added_row.selection == SAMPLE_SELECTION
        assert added_row.locked == SAMPLE_LOCKED
    finally:
        clear_overrides()


def test_save_timetable_updates_existing_row_in_place():
    row = MagicMock(spec=UserTimetable)
    row.selection = {}
    row.locked = []

    db = MagicMock()
    db.get.return_value = row

    setup_overrides(user=make_user(), db=db)
    try:
        client.put(
            "/timetable",
            json={"selection": SAMPLE_SELECTION, "locked": SAMPLE_LOCKED},
        )

        assert row.selection == SAMPLE_SELECTION
        assert row.locked == SAMPLE_LOCKED
        db.commit.assert_called_once()
        db.add.assert_not_called()
    finally:
        clear_overrides()


def test_save_timetable_accepts_empty_selection_and_locked():
    db = MagicMock()
    db.get.return_value = None

    setup_overrides(user=make_user(), db=db)
    try:
        response = client.put("/timetable", json={"selection": {}, "locked": []})
        assert response.status_code == 204
    finally:
        clear_overrides()


def test_save_timetable_rejects_missing_locked_field():
    setup_overrides(user=make_user(), db=MagicMock())
    try:
        response = client.put("/timetable", json={"selection": {}})
        assert response.status_code == 422
    finally:
        clear_overrides()


def test_save_timetable_rejects_wrong_type_for_locked():
    setup_overrides(user=make_user(), db=MagicMock())
    try:
        response = client.put(
            "/timetable", json={"selection": {}, "locked": "not-a-list"}
        )
        assert response.status_code == 422
    finally:
        clear_overrides()


def test_save_timetable_rejects_wrong_type_for_selection():
    setup_overrides(user=make_user(), db=MagicMock())
    try:
        response = client.put(
            "/timetable", json={"selection": "not-a-dict", "locked": []}
        )
        assert response.status_code == 422
    finally:
        clear_overrides()
