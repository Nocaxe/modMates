'''API endpoints for managing user timetables.'''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import UserTimetable, GroupMembership
from app.schemas import TimetableBody, BatchTimetableUpdateRequest

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


@router.put("/timetable/batch", status_code=204)
def batch_save_timetable(
    body: BatchTimetableUpdateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    '''Update the selection field for multiple users in a group atomically.'''
    caller_id = user["sub"]

    if db.get(GroupMembership, (body.group_id, caller_id)) is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    for update in body.updates:
        if db.get(GroupMembership, (body.group_id, update.user_id)) is None:
            raise HTTPException(
                status_code=403,
                detail=f"User {update.user_id} is not a member of this group",
            )

    for update in body.updates:
        row = db.get(UserTimetable, update.user_id)
        if row is None:
            row = UserTimetable(
                user_id=update.user_id,
                selection=update.selection,
                locked=[],
                skipped=[],
                modules=[],
                constraints=[],
            )
            db.add(row)
        else:
            row.selection = update.selection
    db.commit()
