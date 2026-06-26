from sqlalchemy import true


def _slots_clash(s1, s2) -> bool:
    return (
        s1.day == s2.day
        and s1.startTime < s2.endTime
        and s1.endTime > s2.startTime
    )

def _option_passes_hard(slots, c: dict) -> bool:
    """Returns True if slot option does not violate the constraint, else False"""
    t = c["type"]
    if t == "earliest_start":
        return all(s.startTime >= c["time"] for s in slots)
    if t == "latest_end":
        return all(s.endTime <= c["time"] for s in slots)
    if t == "blocked_slot":
        return not any(
            s.day == c["day"] and s.startTime < c["endTime"] and s.endTime > c["startTime"]
            for s in slots
        )
    return True


## minimal solve() for now with a backtracking solver that finds first clash-free selection 
## excludes constraint scoring ye
def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    return {}