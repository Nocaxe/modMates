from dataclasses import dataclass, field

@dataclass
class Slot:
    class_no: str
    day: str
    start: int
    end: int
    venue: str

def _parse(t: str) -> int:
    return int(t[:2]) * 60 + int(t[2:])

def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    return {}