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

@router.get("/groups", response_model=list[GroupOut])
def list_my_groups(user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to list the groups the caller is a member of.'''
    memberships = db.query(GroupMembership).filter(GroupMembership.user_id == user["sub"]).all()
    groups = []
    for m in memberships:
        group = db.get(Group, m.group_id)
        member_count = db.query(GroupMembership).filter(GroupMembership.group_id == group.id).count()
        groups.append(GroupOut(
            id=group.id,
            name=group.name,
            owner_id=group.owner_id,
            invite_code=group.invite_code,
            created_at=group.created_at,
            member_count=member_count
        ))
    return groups

@router.get("/groups/{group_id}/members", response_model=list[GroupMemberInfo])
def get_group_members(group_id: int, user=Depends(get_current_user), db: Session    = Depends(get_db)):
    '''Endpoint to retrieve the members of a group.'''
    membership = db.get(GroupMembership, (group_id, user["sub"]))
    if membership is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    memberships = db.query(GroupMembership).filter(GroupMembership.group_id == group_id).all()
    members_info = []
    for m in memberships:
        profile = db.get(Profile, m.user_id)
        members_info.append(GroupMemberInfo(
            user_id = profile.user_id,
            email = profile.email,
            joined_at = m.joined_at
        ))

    return members_info     

@router.delete("/groups/{group_id}/members/me", status_code=204)
def leave_group(group_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to leave a group.'''
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    membership = db.get(GroupMembership, (group_id, user["sub"]))
    if membership is None:
        raise HTTPException(status_code=404, detail="Not a member of this group")

    db.delete(membership)

    if group.owner_id == user["sub"]:
        remaining = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id
        ).order_by(GroupMembership.joined_at).first()

        if remaining is None:
            db.delete(group)
        else:
            group.owner_id = remaining.user_id

    db.commit()

@router.get("/groups/{group_id}/optimiser-members", response_model=list[GroupMemberOut])
def get_optimiser_members(group_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Endpoint to retrieve the members of a group, shaped for optimiser.'''
    membership = db.get(GroupMembership, (group_id, user["sub"]))
    if membership is None:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id, GroupMembership.user_id != user["sub"]
        ).all() ## prevent double counting of the user's own timetable
    
    members_info = []
    for m in memberships:
        timetable = db.get(UserTimetable, m.user_id)
        if timetable is None:
            continue
        profile = db.get(Profile, m.user_id)
        members_info.append(GroupMemberOut(
            name = profile.email,
            ranked_selections = [timetable.selection]
        ))

    return members_info