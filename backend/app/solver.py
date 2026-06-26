def _parse(t: str) -> int:
    return int(t[:2]) * 60 + int(t[2:])

def _slots_clash(s1, s2) -> bool:
    return (
        s1.day == s2.day
        and _parse(s1.startTime) < _parse(s2.endTime)
        and _parse(s2.startTime) < _parse(s1.endTime)
    )

def _option_passes_hard(slots, c: dict) -> bool:
    """Returns True if slot option does not violate the constraint, else False"""

    t = c["type"]
    if t == "earliest_start":
        return all(_parse(s.startTime) >= _parse(c["time"]) for s in slots)
    if t == "latest_end":
        return all(_parse(s.endTime) <= _parse(c["time"]) for s in slots)
    if t == "blocked_slot":
        bs, be = _parse(c["startTime"]), _parse(c["endTime"])
        return not any(
            s.day == c["day"] and _parse(s.startTime) < be and _parse(s.endTime) > bs
            for s in slots
        )

def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    return {}