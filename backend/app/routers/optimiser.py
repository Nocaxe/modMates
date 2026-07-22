from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
import httpx
from sqlalchemy.orm import Session
from app.solver import solve_top_n, solve_joint
from app.database import get_db
from app.auth import get_current_user
from app.models import GroupMembership, UserTimetable, Profile
from app.schemas import JointOptimiseRequest, JointOptimiseResponse, JointMemberResult, JointSolution
from app.routers.modules import NUSMODS_BASE, ACAD_YEAR

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


def _parse_nusmods_to_module_in(raw: dict) -> ModuleIn:
    timetable = raw.get("semesterData", [{}])[0].get("timetable", [])
    lessons: dict[str, LessonGroupIn] = {}
    for lesson in timetable:
        lt = lesson["lessonType"]
        slot = SlotIn(
            classNo=lesson["classNo"],
            day=lesson["day"],
            start=int(lesson["startTime"][:2]) * 60 + int(lesson["startTime"][2:]),
            end=int(lesson["endTime"][:2]) * 60 + int(lesson["endTime"][2:]),
            venue=lesson.get("venue", ""),
        )
        if lt not in lessons:
            lessons[lt] = LessonGroupIn(slots=[])
        lessons[lt].slots.append(slot)
    return ModuleIn(code=raw["moduleCode"], title=raw.get("title", ""), lessons=lessons)


@router.post("/optimise/joint", response_model=JointOptimiseResponse)
async def joint_optimise(
    body: JointOptimiseRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    caller_id = user["sub"]

    # Verify caller is in the group
    if db.get(GroupMembership, (body.group_id, caller_id)) is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # Collect all group members with their emails
    memberships = (
        db.query(GroupMembership)
        .filter(GroupMembership.group_id == body.group_id)
        .all()
    )
    uid_to_email: dict[str, str] = {}
    for m in memberships:
        profile = db.get(Profile, m.user_id)
        if profile:
            uid_to_email[m.user_id] = profile.email

    # Fetch each member's timetable, skip those with no modules
    qualifying: list[tuple[str, UserTimetable]] = []
    for uid in uid_to_email:
        row = db.get(UserTimetable, uid)
        if row and row.modules:
            qualifying.append((uid, row))

    if len(qualifying) < 2:
        raise HTTPException(
            status_code=422,
            detail="At least 2 group members with saved timetables are required for joint optimisation.",
        )

    # Fetch NUSMods data for each member's modules
    async with httpx.AsyncClient() as client:
        user_inputs = []
        for uid, row in qualifying:
            modules: list[ModuleIn] = []
            for code in (row.modules or []):
                try:
                    resp = await client.get(
                        f"{NUSMODS_BASE}/{ACAD_YEAR}/modules/{code.upper()}.json"
                    )
                    if resp.status_code == 404:
                        continue
                    resp.raise_for_status()
                    modules.append(_parse_nusmods_to_module_in(resp.json()))
                except Exception:
                    continue  # skip modules that fail to fetch

            if not modules:
                continue

            constraints_filtered = [
                c for c in (row.constraints or [])
                if c.get("type") != "group_overlap"
            ]
            user_inputs.append({
                "user_id": uid,
                "modules": modules,
                "selection": row.selection or {},
                "locked": set(row.locked or []),
                "skipped": frozenset(row.skipped or []),
                "constraints": constraints_filtered,
            })

    if len(user_inputs) < 2:
        raise HTTPException(
            status_code=422,
            detail="At least 2 group members with fetchable modules are required.",
        )

    all_solutions = solve_joint(user_inputs, n=5)
    if not all_solutions:
        raise HTTPException(
            status_code=422,
            detail="Joint optimisation could not find a satisfiable timetable. Hard constraints may be in conflict.",
        )

    uid_to_current = {uid: (row.selection or {}) for uid, row in qualifying}

    return JointOptimiseResponse(
        solutions=[
            JointSolution(
                members=[
                    JointMemberResult(
                        user_id=r["user_id"],
                        email=uid_to_email.get(r["user_id"], ""),
                        proposed_selection=r["selection"],
                        current_selection=uid_to_current.get(r["user_id"], {}),
                        score=r["score"],
                    )
                    for r in solution
                ]
            )
            for solution in all_solutions
        ]
    )
