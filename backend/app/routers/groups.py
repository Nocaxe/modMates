'''API endpoints for managing groups.'''
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Group, GroupMembership, Profile, UserTimetable
from app.schemas import GroupCreate, GroupOut, GroupJoinBody, GroupMemberInfo, GroupMemberOut   

router = APIRouter()

@router.post("/groups", response_model=GroupOut, status_code=201)
def create_group(body: GroupCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to create a new group.'''
    group = Group(name=body.name, owner_id=user["sub"])
    db.add(group)
    db.flush()
    db.add(GroupMembership(group_id=group.id, user_id=user["sub"]))
    db.commit()

    return GroupOut(
        id = group.id,
        name = group.name,
        owner_id = group.owner_id,
        invite_code = group.invite_code,
        created_at = group.created_at,
        member_count = 1
    )

@router.post("/groups/join", response_model=GroupOut)
def join_group(body: GroupJoinBody, response: Response, user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to join a group using an invite code.'''
    group = db.query(Group).filter(Group.invite_code == body.invite_code).first()
    if group is None:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    if db.get(GroupMembership, (group.id, user["sub"])) is None:
        db.add(GroupMembership(group_id=group.id, user_id=user["sub"]))
        db.commit()
        response.status_code = 201

    member_count = db.query(GroupMembership).filter(GroupMembership.group_id == group.id).count()

    return GroupOut(
        id = group.id,
        name = group.name,
        owner_id = group.owner_id,
        invite_code = group.invite_code,
        created_at = group.created_at,
        member_count = member_count
    )