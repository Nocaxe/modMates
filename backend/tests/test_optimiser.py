"""Tests for POST /optimise endpoint."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# fixtures 

def make_slot(classNo, day, start, end):
    return {"classNo": classNo, "day": day, "start": start, "end": end, "venue": "LT1"}

def make_module(code, lessons):
    """lessons: {lessonType: [slot_dict, ...]}"""
    return {
        "code": code,
        "title": code,
        "lessons": {lt: {"slots": slots} for lt, slots in lessons.items()},
    }

MOD_A = make_module("CS1010", {
    "Lecture": [make_slot("01", "Monday", 540, 660)],
})

MOD_B = make_module("CS2040S", {
    "Lecture":  [make_slot("01", "Tuesday", 540, 660)],
    "Tutorial": [make_slot("10", "Wednesday", 600, 660)],
})


# basic response shape 

def test_optimise_returns_200_with_selection_and_score():
    body = {"modules": [MOD_A], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    assert response.status_code == 200
    data = response.json()
    assert "selection" in data
    assert "score" in data

def test_optimise_selection_contains_all_lesson_types():
    body = {"modules": [MOD_B], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    data = response.json()
    assert "Lecture" in data["selection"]["CS2040S"]
    assert "Tutorial" in data["selection"]["CS2040S"]

def test_optimise_score_is_1_with_no_soft_constraints():
    body = {"modules": [MOD_A], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    assert response.json()["score"] == 1.0


# clash handling 

def test_optimise_returns_negative_score_when_no_valid_assignment():
    # Two lesson types with only one option each, and they clash
    mod = make_module("CS9999", {
        "Lecture":  [make_slot("01", "Monday", 540, 660)],
        "Tutorial": [make_slot("10", "Monday", 600, 720)],
    })
    body = {"modules": [mod], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    data = response.json()
    assert data["score"] == -1.0
    assert data["selection"] == {}

def test_optimise_picks_non_clashing_options():
    mod = make_module("CS2040S", {
        "Lecture":  [make_slot("01", "Monday", 540, 660)],
        "Tutorial": [
            make_slot("10", "Monday", 540, 660),   # clashes with Lecture 01
            make_slot("11", "Monday", 660, 720),   # no clash
        ],
    })
    body = {"modules": [mod], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    data = response.json()
    assert data["score"] >= 0
    assert data["selection"]["CS2040S"]["Tutorial"] == "11"


# locked slots 

def test_optimise_respects_locked_lesson_type():
    mod = make_module("CS2040S", {
        "Lecture": [
            make_slot("01", "Monday", 540, 660),
            make_slot("02", "Tuesday", 540, 660),
        ],
    })
    body = {
        "modules": [mod],
        "selection": {"CS2040S": {"Lecture": "02"}},
        "locked": ["CS2040S|Lecture"],
        "constraints": [],
    }
    response = client.post("/optimise", json=body)
    assert response.json()["selection"]["CS2040S"]["Lecture"] == "02"


# hard constraints 

def test_optimise_hard_earliest_start_excludes_early_options():
    mod = make_module("CS2040S", {
        "Lecture": [
            make_slot("01", "Monday", 480, 540),   # 8–9, violates constraint
            make_slot("02", "Monday", 540, 600),   # 9–10, ok
        ],
    })
    body = {
        "modules": [mod],
        "selection": {},
        "locked": [],
        "constraints": [{"type": "earliest_start", "time": "0900", "kind": "hard"}],
    }
    response = client.post("/optimise", json=body)
    assert response.json()["selection"]["CS2040S"]["Lecture"] == "02"


# validation 

def test_optimise_rejects_missing_modules_field():
    body = {"selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    assert response.status_code == 422

def test_optimise_rejects_missing_selection_field():
    body = {"modules": [], "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    assert response.status_code == 422

def test_optimise_accepts_empty_modules_list():
    body = {"modules": [], "selection": {}, "locked": [], "constraints": []}
    response = client.post("/optimise", json=body)
    assert response.status_code == 200
