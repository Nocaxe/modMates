import z3

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def _parse(t: str) -> int:
    return int(t[:2]) * 60 + int(t[2:])


def _slots_clash(s1, s2) -> bool:
    return s1.day == s2.day and s1.start < s2.end and s1.end > s2.start


def _timeslot_sig(slots: list) -> frozenset:
    """Canonical identity for a class option: set of (day, start, end) tuples.

    Two classNos with the same signature occupy identical physical time slots and
    are treated as equivalent when blocking duplicate solutions.
    """
    return frozenset((s.day, s.start, s.end) for s in slots)


def _option_passes_hard(slots, c: dict) -> bool:
    t = c["type"]
    if t == "earliest_start":
        return all(s.start >= _parse(c["time"]) for s in slots)
    if t == "latest_end":
        return all(s.end <= _parse(c["time"]) for s in slots)
    if t == "blocked_slot":
        return not any(
            s.day == c["day"]
            and s.start < _parse(c["endTime"])
            and s.end > _parse(c["startTime"])
            for s in slots
        )
    if t == "specific_free_days":
        days = set(c.get("days", []))
        return not any(s.day in days for s in slots)
    return True


def _compute_score(
    soft_constraints: list[dict],
    sel: dict,
    classno_to_slots: dict,
    members_for_rank: list[dict] | None = None,
    skipped: frozenset = frozenset(),
) -> float:
    """Compute normalised score [0, 1] based on fraction of soft-constraint weight satisfied."""
    if not soft_constraints:
        return 1.0

    # Exclude skipped lesson types from all constraint evaluation
    sel_active = {k: v for k, v in sel.items() if f"{k[0]}|{k[1]}" not in skipped}

    assigned: list = []
    for key, cno in sel_active.items():
        assigned.extend(classno_to_slots[key][cno])

    slots_by_day: dict[str, list] = {d: [] for d in DAYS}
    for s in assigned:
        if s.day in slots_by_day:
            slots_by_day[s.day].append(s)

    total_w = 0
    satisfied_w = 0.0

    _WEIGHT_MAP = [1, 3, 10, 30, 100]
    for c in soft_constraints:
        t = c["type"]
        w = _WEIGHT_MAP[max(0, min(4, int(c.get("weight", 1)) - 1))]
        total_w += w
        fraction = 0.0  # partial credit in [0, 1]

        if t in ("earliest_start", "latest_end", "blocked_slot"):
            # Fraction of non-skipped lesson types whose chosen class satisfies the constraint
            total_keys = len(sel_active)
            if total_keys == 0:
                fraction = 1.0
            else:
                fraction = sum(
                    1 for k, cno in sel_active.items()
                    if _option_passes_hard(classno_to_slots[k][cno], c)
                ) / total_keys

        elif t == "specific_free_days":
            days = c.get("days", [])
            if not days:
                fraction = 1.0
            else:
                fraction = sum(1 for d in days if not slots_by_day.get(d)) / len(days)

        elif t == "free_days_count":
            free = sum(1 for d in DAYS if not slots_by_day[d])
            required = c.get("count", 1)
            fraction = min(1.0, free / max(required, 1))

        elif t == "lunch_break":
            start_t = _parse(c.get("startTime", "1200"))
            dur = int(c.get("duration", 60))
            days_with = [d for d, s in slots_by_day.items() if s]
            if not days_with:
                fraction = 1.0
            else:
                ok_days = sum(
                    1 for d in days_with
                    if not any(s.start < start_t + dur and s.end > start_t for s in slots_by_day[d])
                )
                fraction = ok_days / len(days_with)

        elif t == "max_consecutive":
            max_mins = int(c.get("hours", 3)) * 60
            days_with = [d for d, s in slots_by_day.items() if s]
            if not days_with:
                fraction = 1.0
            else:
                ok_days = 0
                for d in days_with:
                    sorted_s = sorted(slots_by_day[d], key=lambda s: s.start)
                    run_end = sorted_s[0].end
                    run_len = sorted_s[0].end - sorted_s[0].start
                    max_run = run_len
                    for s in sorted_s[1:]:
                        if s.start <= run_end:
                            run_len += s.end - s.start
                            run_end = max(run_end, s.end)
                        else:
                            run_len = s.end - s.start
                            run_end = s.end
                        max_run = max(max_run, run_len)
                    if max_run <= max_mins:
                        ok_days += 1
                fraction = ok_days / len(days_with)

        elif t == "group_overlap":
            total_pairs = 0
            matched = 0
            for member_flat in (members_for_rank or []):
                for key, target_cno in member_flat.items():
                    if key in sel_active:
                        total_pairs += 1
                        if sel_active[key] == target_cno:
                            matched += 1
            fraction = matched / total_pairs if total_pairs > 0 else 1.0

        satisfied_w += fraction * w

    return satisfied_w / total_w if total_w > 0 else 1.0


def _build_opt(
    modules,
    selection: dict,
    locked: set[str],
    constraints: list[dict],
    members_for_rank: list[dict],
    extra_blocking: list,
    skipped: frozenset = frozenset(),
):
    """Build and return a configured Z3 Optimize instance plus indexing dicts.

    Returns (opt, z3_vars, index_to_classno, classno_to_slots, soft_constraints).
    members_for_rank: list of flattened member selections [{(code, lt): classNo}, ...]
    extra_blocking: list of z3 expressions added as hard constraints to exclude prior solutions.
    """
    opt = z3.Optimize()
    z3_vars: dict = {}
    index_to_classno: dict = {}
    classno_to_slots: dict = {}

    # Variables and domain constraints
    for mod in modules:
        for lessonType, lessonGroup in mod.lessons.items():
            key = (mod.code, lessonType)
            class_groups: dict = {}
            for slot in lessonGroup.slots:
                class_groups.setdefault(slot.classNo, []).append(slot)

            index_to_classno[key] = list(class_groups.keys())
            classno_to_slots[key] = class_groups

            var = z3.Int(f"{mod.code}__{lessonType.replace(' ', '_')}")
            z3_vars[key] = var
            opt.add(var >= 0, var < len(index_to_classno[key]))

    # Pin locked lesson types to current selection index
    for mod in modules:
        for lessonType in mod.lessons:
            if f"{mod.code}|{lessonType}" in locked:
                key = (mod.code, lessonType)
                current = selection.get(mod.code, {}).get(lessonType)
                if current and current in index_to_classno.get(key, []):
                    idx = index_to_classno[key].index(current)
                    opt.add(z3_vars[key] == idx)

    # Clash constraints: forbid any pair of options that overlap in time
    keys = list(z3_vars.keys())
    for ai in range(len(keys)):
        for bi in range(ai + 1, len(keys)):
            key_a, key_b = keys[ai], keys[bi]
            var_a, var_b = z3_vars[key_a], z3_vars[key_b]
            for i, cno_a in enumerate(index_to_classno[key_a]):
                slots_a = classno_to_slots[key_a][cno_a]
                for j, cno_b in enumerate(index_to_classno[key_b]):
                    slots_b = classno_to_slots[key_b][cno_b]
                    if any(_slots_clash(s1, s2) for s1 in slots_a for s2 in slots_b):
                        opt.add(z3.Not(z3.And(var_a == i, var_b == j)))

    hard = [c for c in constraints if c.get("kind") == "hard"]
    soft = [c for c in constraints if c.get("kind") == "soft"]

    # Hard constraints: forbid options that violate them (skipped lesson types are exempt)
    for c in hard:
        t = c.get("type")
        if t == "free_days_count":
            required = c.get("count", 1)
            day_free_flags = []
            for day in DAYS:
                on_day = [
                    var == i
                    for key, var in z3_vars.items()
                    if f"{key[0]}|{key[1]}" not in skipped
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                day_free = z3.Not(z3.Or(on_day)) if on_day else z3.BoolVal(True)
                day_free_flags.append(z3.If(day_free, 1, 0))
            opt.add(z3.Sum(day_free_flags) >= required)
        else:
            for key, var in z3_vars.items():
                if f"{key[0]}|{key[1]}" in skipped:
                    continue
                for i, cno in enumerate(index_to_classno[key]):
                    if not _option_passes_hard(classno_to_slots[key][cno], c):
                        opt.add(var != i)

    # Soft constraints: maximise weighted satisfaction (skipped lesson types are exempt)
    _WEIGHT_MAP = [1, 3, 10, 30, 100]
    for c in soft:
        t = c["type"]
        w = _WEIGHT_MAP[max(0, min(4, int(c.get("weight", 1)) - 1))]

        if t in ("earliest_start", "latest_end", "blocked_slot"):
            for key, var in z3_vars.items():
                if f"{key[0]}|{key[1]}" in skipped:
                    continue
                for i, cno in enumerate(index_to_classno[key]):
                    if not _option_passes_hard(classno_to_slots[key][cno], c):
                        opt.add_soft(var != i, weight=w)

        elif t == "specific_free_days":
            for day in c.get("days", []):
                not_on_day = [
                    var != i
                    for key, var in z3_vars.items()
                    if f"{key[0]}|{key[1]}" not in skipped
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                if not_on_day:
                    opt.add_soft(z3.And(not_on_day), weight=w)

        elif t == "free_days_count":
            for day in DAYS:
                not_on_day = [
                    var != i
                    for key, var in z3_vars.items()
                    if f"{key[0]}|{key[1]}" not in skipped
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                if not_on_day:
                    opt.add_soft(z3.And(not_on_day), weight=w)

        elif t == "lunch_break":
            start_t = _parse(c.get("startTime", "1200"))
            dur = int(c.get("duration", 60))
            for day in DAYS:
                blocking = [
                    var == i
                    for key, var in z3_vars.items()
                    if f"{key[0]}|{key[1]}" not in skipped
                    for i, cno in enumerate(index_to_classno[key])
                    for s in classno_to_slots[key][cno]
                    if s.day == day and s.start < start_t + dur and s.end > start_t
                ]
                if blocking:
                    opt.add_soft(z3.Not(z3.Or(blocking)), weight=w)

        elif t == "max_consecutive":
            max_mins = int(c.get("hours", 3)) * 60
            for day in DAYS:
                day_opts = [
                    (key, i, [s for s in classno_to_slots[key][cno] if s.day == day])
                    for key, _ in z3_vars.items()
                    if f"{key[0]}|{key[1]}" not in skipped
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                for a_idx, (ka, ia, sa) in enumerate(day_opts):
                    for kb, ib, sb in day_opts[a_idx + 1:]:
                        if ka == kb:
                            continue
                        combined = sorted(sa + sb, key=lambda s: s.start)
                        run_end = combined[0].end
                        run_len = combined[0].end - combined[0].start
                        max_run = run_len
                        for s in combined[1:]:
                            if s.start <= run_end:
                                run_len += s.end - s.start
                                run_end = max(run_end, s.end)
                            else:
                                run_len = s.end - s.start
                                run_end = s.end
                            max_run = max(max_run, run_len)
                        if max_run > max_mins:
                            opt.add_soft(
                                z3.Not(z3.And(z3_vars[ka] == ia, z3_vars[kb] == ib)),
                                weight=w,
                            )

        elif t == "group_overlap":
            # Reward matching each group member's class selection for shared non-skipped modules
            for member_flat in members_for_rank:
                for key, var in z3_vars.items():
                    if f"{key[0]}|{key[1]}" in skipped:
                        continue
                    target_cno = member_flat.get(key)
                    if target_cno and target_cno in index_to_classno[key]:
                        target_idx = index_to_classno[key].index(target_cno)
                        opt.add_soft(var == target_idx, weight=w)

    # Block previously found solutions
    for clause in extra_blocking:
        opt.add(clause)

    return opt, z3_vars, index_to_classno, classno_to_slots, soft


def _solve_once(opt, z3_vars: dict, index_to_classno: dict) -> dict | None:
    """Run opt.check() and extract sel_keyed. Returns None on UNSAT."""
    if opt.check() != z3.sat:
        return None
    model = opt.model()
    return {
        key: index_to_classno[key][(model[var].as_long() if model[var] is not None else 0)]
        for key, var in z3_vars.items()
    }


def solve_top_n(
    modules,
    selection: dict,
    locked: set[str],
    constraints: list[dict],
    group_members: list[dict] | None = None,
    skipped: set[str] | None = None,
    n: int = 5,
) -> list[dict]:
    """Return up to n distinct ranked solutions, best first."""
    skipped_frozen: frozenset = frozenset(skipped) if skipped else frozenset()
    results: list[dict] = []
    blocking_history: list = []
    soft = [c for c in constraints if c.get("kind") == "soft"]

    for rank in range(n):
        # Flatten each member's rank-i selection to {(code, lt): classNo}
        members_for_rank: list[dict] = []
        if group_members:
            for member in group_members:
                ranked = member["ranked_selections"]
                nested = ranked[min(rank, len(ranked) - 1)]
                members_for_rank.append({
                    (code, lt): cno
                    for code, lmap in nested.items()
                    for lt, cno in lmap.items()
                })

        opt, z3_vars, idx2cno, cno2slots, _ = _build_opt(
            modules, selection, locked, constraints, members_for_rank, blocking_history,
            skipped=skipped_frozen,
        )

        sel_keyed = _solve_once(opt, z3_vars, idx2cno)
        if sel_keyed is None:
            break

        # Convert (code, lessonType) -> classNo to nested code -> lessonType -> classNo
        sel: dict[str, dict[str, str]] = {}
        for (code, lt), cno in sel_keyed.items():
            sel.setdefault(code, {})[lt] = cno

        score = _compute_score(soft, sel_keyed, cno2slots, members_for_rank, skipped=skipped_frozen)
        results.append({"selection": sel, "score": score})

        # Block any assignment that is timeslot-equivalent to this one.
        # Classes with the same (day, start, end) signature are treated as identical,
        # so solutions only differ when at least one lesson type moves to a distinct timeslot.
        block_per_key = []
        for k, cno in sel_keyed.items():
            if k not in z3_vars:
                continue
            selected_sig = _timeslot_sig(cno2slots[k][cno])
            same_ts_indices = [
                i for i, other_cno in enumerate(idx2cno[k])
                if _timeslot_sig(cno2slots[k][other_cno]) == selected_sig
            ]
            # "This variable picks a DIFFERENT timeslot" = not assigned to any same-signature index
            block_per_key.append(z3.And([z3_vars[k] != i for i in same_ts_indices]))
        if block_per_key:
            blocking_history.append(z3.Or(block_per_key))

    return results


def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    results = solve_top_n(modules, selection, locked, constraints, n=1)
    return results[0] if results else {"selection": {}, "score": -1.0}
