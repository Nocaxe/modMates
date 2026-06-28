from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.solver import solve

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

class OptimiseRequest(BaseModel):
    modules: list[ModuleIn]
    selection: dict[str, dict[str, str]] # {code: {lessonType: classNo}}
    locked: list[str]
    constraints: list[dict[str, Any]]

class OptimiseResponse(BaseModel):
    selection: dict[str, dict[str, str]]
    score: float

@router.post("/optimise", response_model=OptimiseResponse)
async def optimise(body: OptimiseRequest):
    result = solve(body.modules, body.selection, set(body.locked), body.constraints)
    return OptimiseResponse(selection=result["selection"], score=result["score"])
