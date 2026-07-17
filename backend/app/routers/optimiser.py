from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.solver import solve_top_n

router = APIRouter()

class SlotIn(BaseModel):
    classNo: str
    day: str
    start: int
    end: int
    venue: str

class LessonGroupIn(BaseModel):
    slots: list[SlotIn]

class ModuleIn(BaseModel):
    code: str
    title: str
    lessons: dict[str, LessonGroupIn]

class GroupMember(BaseModel):
    name: str
    ranked_selections: list[dict[str, dict[str, str]]]  # up to 5, one per rank

class OptimiseRequest(BaseModel):
    modules: list[ModuleIn]
    selection: dict[str, dict[str, str]]
    locked: list[str]
    skipped: list[str] = []
    constraints: list[dict[str, Any]]
    group_members: list[GroupMember] = []  # empty = individual mode

class RankedSolution(BaseModel):
    selection: dict[str, dict[str, str]]
    score: float

class OptimiseResponse(BaseModel):
    solutions: list[RankedSolution]

@router.post("/optimise", response_model=OptimiseResponse)
async def optimise(body: OptimiseRequest):
    group_members_raw = [
        {"name": gm.name, "ranked_selections": gm.ranked_selections}
        for gm in body.group_members
    ] or None

    results = solve_top_n(
        body.modules,
        body.selection,
        set(body.locked),
        body.constraints,
        group_members=group_members_raw,
        skipped=set(body.skipped),
        n=5,
    )

    if not results:
        return OptimiseResponse(solutions=[RankedSolution(selection={}, score=-1.0)])

    return OptimiseResponse(
        solutions=[RankedSolution(selection=r["selection"], score=r["score"]) for r in results]
    )
