"""Unit tests for the Z3-based timetable solver."""
from types import SimpleNamespace
from app.solver import solve, solve_joint, _parse, _slots_clash, _option_passes_hard


# helpers

def slot(classNo, day, start, end):
    return SimpleNamespace(classNo=classNo, day=day, start=start, end=end)

def module(code, lessons):
    """lessons: {lessonType: [slot, ...]}"""
    return SimpleNamespace(
        code=code,
        title=code,
        lessons={lt: SimpleNamespace(slots=slots) for lt, slots in lessons.items()},
    )


# _parse

def test_parse_morning():
    assert _parse("0900") == 540

def test_parse_noon():
    assert _parse("1200") == 720

def test_parse_afternoon():
    assert _parse("1730") == 1050


# _slots_clash 

def test_slots_clash_overlapping_same_day():
    s1 = slot("01", "Monday", 540, 660)  # 9–11
    s2 = slot("02", "Monday", 600, 720)  # 10–12
    assert _slots_clash(s1, s2) is True

def test_slots_clash_adjacent_same_day():
    s1 = slot("01", "Monday", 540, 600)  # 9–10
    s2 = slot("02", "Monday", 600, 660)  # 10–11
    assert _slots_clash(s1, s2) is False

def test_slots_clash_different_days():
    s1 = slot("01", "Monday", 540, 660)
    s2 = slot("02", "Tuesday", 540, 660)
    assert _slots_clash(s1, s2) is False

def test_slots_clash_no_overlap_same_day():
    s1 = slot("01", "Monday", 540, 600)  # 9–10
    s2 = slot("02", "Monday", 660, 720)  # 11–12
    assert _slots_clash(s1, s2) is False


# _option_passes_hard 

def test_earliest_start_passes_when_on_time():
    slots = [slot("01", "Monday", 540, 600)]   # starts at 540 (9:00)
    assert _option_passes_hard(slots, {"type": "earliest_start", "time": "0900"}) is True

def test_earliest_start_fails_when_too_early():
    slots = [slot("01", "Monday", 480, 540)]   # starts at 480 (8:00)
    assert _option_passes_hard(slots, {"type": "earliest_start", "time": "0900"}) is False

def test_latest_end_passes_when_on_time():
    slots = [slot("01", "Monday", 600, 660)]   # ends at 660 (11:00)
    assert _option_passes_hard(slots, {"type": "latest_end", "time": "1200"}) is True

def test_latest_end_fails_when_too_late():
    slots = [slot("01", "Monday", 1020, 1140)] # ends at 1140 (19:00)
    assert _option_passes_hard(slots, {"type": "latest_end", "time": "1800"}) is False

def test_blocked_slot_passes_when_no_overlap():
    slots = [slot("01", "Monday", 540, 600)]   # 9–10
    c = {"type": "blocked_slot", "day": "Monday", "startTime": "1200", "endTime": "1400"}
    assert _option_passes_hard(slots, c) is True

def test_blocked_slot_fails_when_overlapping():
    slots = [slot("01", "Monday", 720, 780)]   # 12–13
    c = {"type": "blocked_slot", "day": "Monday", "startTime": "1200", "endTime": "1400"}
    assert _option_passes_hard(slots, c) is False


# solve: basic cases 

def test_solve_single_module_single_option():
    mod = module("CS1010", {"Lecture": [slot("01", "Monday", 540, 660)]})
    result = solve([mod], {}, set(), [])
    assert result["score"] >= 0
    assert result["selection"]["CS1010"]["Lecture"] == "01"

def test_solve_returns_valid_selection_for_each_lesson_type():
    mod = module("CS2040S", {
        "Lecture":  [slot("01", "Monday", 540, 660)],
        "Tutorial": [slot("10", "Tuesday", 600, 660)],
    })
    result = solve([mod], {}, set(), [])
    assert "Lecture" in result["selection"]["CS2040S"]
    assert "Tutorial" in result["selection"]["CS2040S"]

def test_solve_no_soft_constraints_gives_perfect_score():
    mod = module("CS1010", {"Lecture": [slot("01", "Monday", 540, 660)]})
    result = solve([mod], {}, set(), [])
    assert result["score"] == 1.0


# solve: clash avoidance 

def test_solve_avoids_clashing_class_pairs():
    # Lecture 01 and Tutorial 10 both on Monday 9-11: must pick Tutorial 11 instead
    mod = module("CS2040S", {
        "Lecture":  [slot("01", "Monday", 540, 660)],
        "Tutorial": [
            slot("10", "Monday", 540, 660),   # clashes with Lecture 01
            slot("11", "Monday", 660, 720),   # no clash
        ],
    })
    result = solve([mod], {}, set(), [])
    assert result["score"] >= 0
    assert result["selection"]["CS2040S"]["Tutorial"] == "11"

def test_solve_returns_negative_score_when_all_options_clash():
    # Both lesson types only have one option and they clash
    mod = module("CS2040S", {
        "Lecture":  [slot("01", "Monday", 540, 660)],
        "Tutorial": [slot("10", "Monday", 600, 720)],  # overlaps with Lecture 01
    })
    result = solve([mod], {}, set(), [])
    assert result["score"] == -1.0
    assert result["selection"] == {}


# solve: locked slots 

def test_solve_respects_locked_lesson_type():
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 540, 660),
            slot("02", "Tuesday", 540, 660),
        ],
    })
    selection = {"CS2040S": {"Lecture": "02"}}
    locked = {"CS2040S|Lecture"}
    result = solve([mod], selection, locked, [])
    assert result["selection"]["CS2040S"]["Lecture"] == "02"

def test_solve_only_locks_specified_lesson_type():
    # Lecture is locked, Tutorial is free: solver should still optimise Tutorial
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 540, 660),
            slot("02", "Tuesday", 540, 660),
        ],
        "Tutorial": [
            slot("10", "Monday", 660, 720),
            slot("11", "Wednesday", 540, 600),
        ],
    })
    selection = {"CS2040S": {"Lecture": "02", "Tutorial": "10"}}
    locked = {"CS2040S|Lecture"}
    result = solve([mod], selection, locked, [])
    assert result["selection"]["CS2040S"]["Lecture"] == "02"
    # Tutorial is free to be changed
    assert "Tutorial" in result["selection"]["CS2040S"]


# solve: hard constraints 

def test_solve_hard_earliest_start_eliminates_early_options():
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 480, 540),   # 8–9, too early
            slot("02", "Monday", 540, 600),   # 9–10, ok
        ],
    })
    c = {"type": "earliest_start", "time": "0900", "kind": "hard"}
    result = solve([mod], {}, set(), [c])
    assert result["score"] >= 0
    assert result["selection"]["CS2040S"]["Lecture"] == "02"

def test_solve_hard_constraint_with_no_valid_option_returns_no_solution():
    mod = module("CS2040S", {
        "Lecture": [slot("01", "Monday", 480, 540)],  # 8–9, violates earliest_start
    })
    c = {"type": "earliest_start", "time": "0900", "kind": "hard"}
    result = solve([mod], {}, set(), [c])
    assert result["score"] == -1.0


# solve: soft constraints

def test_solve_soft_earliest_start_prefers_later_slot():
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 480, 540),   # 8–9, violates soft
            slot("02", "Monday", 540, 600),   # 9–10, satisfies soft
        ],
    })
    c = {"type": "earliest_start", "time": "0900", "kind": "soft", "weight": 5}
    result = solve([mod], {}, set(), [c])
    assert result["selection"]["CS2040S"]["Lecture"] == "02"

def test_solve_soft_specific_free_days_prefers_day_off():
    # Two modules: one only on Monday, one has Mon or Tue option.
    # With a "keep Tuesday free" soft constraint, solver should pick Tuesday-free option.
    mod_a = module("CS1010", {"Lecture": [slot("01", "Monday", 540, 660)]})
    mod_b = module("CS2040S", {
        "Lecture": [
            slot("01", "Tuesday", 540, 660),  # violates free Tuesday
            slot("02", "Wednesday", 540, 660), # satisfies free Tuesday
        ],
    })
    c = {"type": "specific_free_days", "days": ["Tuesday"], "kind": "soft", "weight": 5}
    result = solve([mod_a, mod_b], {}, set(), [c])
    assert result["selection"]["CS2040S"]["Lecture"] == "02"


# solve_joint


def user_input(user_id, mods, constraints=None, locked=None, skipped=None, selection=None):
    return {
        "user_id": user_id,
        "modules": mods,
        "selection": selection or {},
        "locked": locked or set(),
        "skipped": skipped or frozenset(),
        "constraints": constraints or [],
    }


def test_solve_joint_shared_module_assigns_same_classno_to_all_users():
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 540, 660),
            slot("02", "Tuesday", 540, 660),
        ],
    })
    results = solve_joint([user_input("alice", [mod]), user_input("bob", [mod])])
    assert len(results) >= 1
    sol = results[0]
    alice = next(r for r in sol if r["user_id"] == "alice")
    bob = next(r for r in sol if r["user_id"] == "bob")
    assert alice["selection"]["CS2040S"]["Lecture"] == bob["selection"]["CS2040S"]["Lecture"]


def test_solve_joint_independent_modules_both_receive_valid_selections():
    mod_a = module("CS1010", {"Lecture": [slot("01", "Monday", 540, 660)]})
    mod_b = module("CS2040S", {"Lecture": [slot("01", "Tuesday", 540, 660)]})
    results = solve_joint([user_input("alice", [mod_a]), user_input("bob", [mod_b])])
    assert len(results) >= 1
    sol = results[0]
    alice = next(r for r in sol if r["user_id"] == "alice")
    bob = next(r for r in sol if r["user_id"] == "bob")
    assert "CS1010" in alice["selection"]
    assert "CS2040S" in bob["selection"]


def test_solve_joint_returns_empty_list_when_hard_constraint_makes_shared_slot_infeasible():
    # Only one Lecture option; alice's hard constraint blocks it → UNSAT
    mod = module("CS2040S", {"Lecture": [slot("01", "Monday", 480, 540)]})  # 8–9am
    constraints = [{"type": "earliest_start", "time": "0900", "kind": "hard"}]
    results = solve_joint([user_input("alice", [mod], constraints=constraints), user_input("bob", [mod])])
    assert results == []


def test_solve_joint_result_entries_have_required_keys():
    mod = module("CS1010", {"Lecture": [slot("01", "Monday", 540, 660)]})
    results = solve_joint([user_input("alice", [mod]), user_input("bob", [mod])])
    assert len(results) >= 1
    for member in results[0]:
        assert "user_id" in member
        assert "selection" in member
        assert "score" in member


def test_solve_joint_returns_distinct_solutions_up_to_n():
    mod = module("CS2040S", {
        "Lecture": [
            slot("01", "Monday", 540, 660),
            slot("02", "Tuesday", 540, 660),
            slot("03", "Wednesday", 540, 660),
        ],
    })
    results = solve_joint([user_input("alice", [mod]), user_input("bob", [mod])], n=3)
    assert len(results) == 3
    chosen = [r[0]["selection"]["CS2040S"]["Lecture"] for r in results]
    assert len(set(chosen)) == 3  # all three are distinct
