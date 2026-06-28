import z3

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def _parse(t: str) -> int:
    return int(t[:2]) * 60 + int(t[2:])


def _slots_clash(s1, s2) -> bool:
    return s1.day == s2.day and s1.start < s2.end and s1.end > s2.start


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
    return True


def _compute_score(soft_constraints: list[dict], sel: dict, classno_to_slots: dict) -> float:
    """Compute normalised score [0, 1] based on fraction of soft-constraint weight satisfied."""
    if not soft_constraints:
        return 1.0

    assigned: list = []
    for key, cno in sel.items():
        assigned.extend(classno_to_slots[key][cno])

    slots_by_day: dict[str, list] = {d: [] for d in DAYS}
    for s in assigned:
        if s.day in slots_by_day:
            slots_by_day[s.day].append(s)

    total_w = 0
    satisfied_w = 0

    for c in soft_constraints:
        t = c["type"]
        w = int(c.get("weight", 1))
        total_w += w
        ok = False

        if t in ("earliest_start", "latest_end", "blocked_slot"):
            ok = all(_option_passes_hard(classno_to_slots[k][cno], c) for k, cno in sel.items())

        elif t == "specific_free_days":
            ok = all(not slots_by_day.get(d) for d in c.get("days", []))

        elif t == "free_days_count":
            free = sum(1 for d in DAYS if not slots_by_day[d])
            ok = free >= c.get("count", 1)

        elif t == "lunch_break":
            start_t = _parse(c.get("startTime", "1200"))
            dur = int(c.get("duration", 60))
            ok = True
            for _, day_slots in slots_by_day.items():
                if not day_slots:
                    continue
                if any(s.start < start_t + dur and s.end > start_t for s in day_slots):
                    ok = False
                    break

        elif t == "max_consecutive":
            max_mins = int(c.get("hours", 3)) * 60
            ok = True
            for _, day_slots in slots_by_day.items():
                if not day_slots:
                    continue
                sorted_s = sorted(day_slots, key=lambda s: s.start)
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
                if max_run > max_mins:
                    ok = False
                    break

        if ok:
            satisfied_w += w

    return satisfied_w / total_w if total_w > 0 else 1.0


def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    opt = z3.Optimize()
    z3_vars: dict = {}            # (mod.code, lessonType) -> z3.Int variable
    index_to_classno: dict = {}   # (mod.code, lessonType) -> [classNo, ...] s value
    classno_to_slots: dict = {}   # (mod.code, lessonType) -> { classNo: [slots] }


    # variables and domain constraints 
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

    # dealing with locked lesson types (pin variable to index of selected class)
    for mod in modules:
        for lessonType in mod.lessons:
            if f"{mod.code}|{lessonType}" in locked:
                key = (mod.code, lessonType)
                current = selection.get(mod.code, {}).get(lessonType)
                if current and current in index_to_classno.get(key, []):
                    idx = index_to_classno[key].index(current)
                    opt.add(z3_vars[key] == idx)

    # clashing constraints, for every pair of variable and every pair of class options
    # if options overlap, Z3 cannot assign both
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

    # separating hard and soft constraints 
    hard = [c for c in constraints if c.get("kind") == "hard"]
    soft = [c for c in constraints if c.get("kind") == "soft"]

    # hard constraints, any options that fails hard will be forbidded   
    for c in hard:
        for key, var in z3_vars.items():
            for i, cno in enumerate(index_to_classno[key]):
                if not _option_passes_hard(classno_to_slots[key][cno], c):
                    opt.add(var != i)

    # soft contraints, Z3 maximises total satisfied weight according to various types
    for c in soft:
        t = c["type"]
        w = int(c.get("weight", 1))

        # Per-option soft: same check as hard, but add_soft instead of add.
        # The solver will prefer honouring these but won't fail if it can't.
        if t in ("earliest_start", "latest_end", "blocked_slot"):
            for key, var in z3_vars.items():
                for i, cno in enumerate(index_to_classno[key]):
                    if not _option_passes_hard(classno_to_slots[key][cno], c):
                        opt.add_soft(var != i, weight=w)

        # Require every listed day to have zero classes assigned.
        elif t == "specific_free_days":
            for day in c.get("days", []):
                not_on_day = [
                    var != i
                    for key, var in z3_vars.items()
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                if not_on_day:
                    opt.add_soft(z3.And(not_on_day), weight=w)

        # Incentivise each possible free day; scoring checks whether target count is met.
        elif t == "free_days_count":
            for day in DAYS:
                not_on_day = [
                    var != i
                    for key, var in z3_vars.items()
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                if not_on_day:
                    opt.add_soft(z3.And(not_on_day), weight=w)

        # Penalise any option that blocks the lunch window [startTime, startTime+duration].
        elif t == "lunch_break":
            start_t = _parse(c.get("startTime", "1200"))
            dur = int(c.get("duration", 60))
            for day in DAYS:
                blocking = [
                    var == i
                    for key, var in z3_vars.items()
                    for i, cno in enumerate(index_to_classno[key])
                    for s in classno_to_slots[key][cno]
                    if s.day == day and s.start < start_t + dur and s.end > start_t
                ]
                if blocking:
                    opt.add_soft(z3.Not(z3.Or(blocking)), weight=w)

        # Penalise pairs of options that together form a consecutive block > max_hours.
        elif t == "max_consecutive":
            max_mins = int(c.get("hours", 3)) * 60
            for day in DAYS:
                day_opts = [
                    (key, i, [s for s in classno_to_slots[key][cno] if s.day == day])
                    for key, _ in z3_vars.items()
                    for i, cno in enumerate(index_to_classno[key])
                    if any(s.day == day for s in classno_to_slots[key][cno])
                ]
                for a_idx, (ka, ia, sa) in enumerate(day_opts):
                    for kb, ib, sb in day_opts[a_idx + 1:]:
                        if ka == kb:
                            continue  # these are alternative options — can't both be chosen
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

    # calls opt.check() to solve, return -1 if cannot solve 
    if opt.check() != z3.sat:
        return {"selection": {}, "score": -1.0}

    model = opt.model()

    # extracting the solution 
    sel_keyed: dict = {}
    for key, var in z3_vars.items():
        val = model[var]
        idx = val.as_long() if val is not None else 0
        sel_keyed[key] = index_to_classno[key][idx]

    # sel: code -> lessonType -> classNo  (returned to the API caller)
    sel: dict[str, dict[str, str]] = {}
    for (code, lessonType), cno in sel_keyed.items():
        sel.setdefault(code, {})[lessonType] = cno

    score = _compute_score(soft, sel_keyed, classno_to_slots)
    return {"selection": sel, "score": score}
