'''API endpoints for managing user timetables.'''
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import UserTimetable
from app.schemas import TimetableBody

router = APIRouter()

@router.get("/timetable")
def get_timetable(user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to retrieve the authenticated user's saved timetable.'''

    row = db.get(UserTimetable, user["sub"])
    if row is None:
        return {"selection": {}, "locked": [], "skipped": [], "modules": [], "constraints": []}
    return {"selection": row.selection, "locked": row.locked, "skipped": row.skipped or [], "modules": row.modules or [], "constraints": row.constraints or []}

@router.put("/timetable", status_code=204)
def save_timetable(body: TimetableBody, user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to save the authenticated user's timetable.'''

    row = db.get(UserTimetable, user["sub"])
    if row is None:
        row = UserTimetable(user_id=user["sub"], selection=body.selection, locked=body.locked, skipped=body.skipped, modules=body.modules, constraints=body.constraints)
        db.add(row)
    else:
        row.selection = body.selection
        row.locked = body.locked
        row.skipped = body.skipped
        row.modules = body.modules
        row.constraints = body.constraints
    db.commit()
    