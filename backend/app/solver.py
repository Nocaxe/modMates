# from sqlalchemy import true

def _parse(t: str) -> int:
    return int(t[:2]) * 60 + int(t[2:])


def _slots_clash(s1, s2) -> bool:
    return (
        s1.day == s2.day
        and s1.start < s2.end
        and s1.end > s2.start
    )

def _option_passes_hard(slots, c: dict) -> bool:
    """Returns True if slot option does not violate the constraint, else False"""
    t = c["type"]
    if t == "earliest_start":
        return all(s.start >= _parse(c["time"]) for s in slots)
    if t == "latest_end":
        return all(s.end <= _parse(c["time"]) for s in slots)
    if t == "blocked_slot":
        return not any(
            s.day == c["day"] and s.start < _parse(c["endTime"]) and s.end > _parse(c["startTime"])
            for s in slots
        )
    return True


## minimal solve() for now with a backtracking solver that finds first clash-free selection 
## excludes constraint scoring ye
def solve(modules, selection, locked: set[str], constraints: list[dict]) -> dict:
    variables = []
    domains = {}
    slot_lookup = {} 

    for mod in modules:
        for lessonType, lessonGroup in mod.lessons.items():
            var = (mod.code, lessonType)
            variables.append(var)
            class_groups: dict[str, list] = {}
            for slot in lessonGroup.slots:
                class_groups.setdefault(slot.classNo, []).append(slot)
            domains[var] = list(class_groups.keys())

            ## given a class number, what slots does it occupy?
            slot_lookup[var] = class_groups
    
    ## recursively backtrack to find valid assignment, each time it clashes it undo last assginment and try next
    assignment = {}
    assigned_slots = []
    best: dict = {"assignment": None, "score": 0.0}

    def backtrack(idx):
        # base case: if all variable assigned , we have a full solution
        if idx == len(variables):
            best["assignment"] = dict(assignment)
            return
        
        var = variables[idx]
        hard = [c for c in constraints if c.get("kind") == "hard"]


        for class_no in domains[var]:
            current_slots = slot_lookup[var][class_no]
            
            # check for clashes with ANY assigned slots, if clash, skip it 
            if any(_slots_clash(s1, s2) 
                   for s1 in current_slots 
                   for s2 in assigned_slots):
                continue  

            # Check hard constraints
            if not all(_option_passes_hard(current_slots, c) for c in hard):
                continue  # Hard constraint violated, try next value

            # no clashes and hard constraints passed, commit this assignment
            assignment[var] = class_no
            assigned_slots.extend(current_slots)

            backtrack(idx + 1)
            
            if best["assignment"] is not None:
                return # Found a valid assignment, no need to continue
            # else undo (backtrack) and remove the slots we just added
            del assigned_slots[-len(current_slots):]
            del assignment[var]
            

        return
    
    backtrack(0)

    if best["assignment"] is None:
        return {"selection": {}, "score": -1.0}

    sel: dict[str, dict[str, str]] = {}
    for (code, lessonType), cn in best["assignment"].items():
        sel.setdefault(code, {})[lessonType] = cn
    
    return {"selection": sel, "score": best["score"]}
