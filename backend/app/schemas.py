'''Schemas for the API endpoints.'''
from datetime import datetime
from pydantic import BaseModel

class TimetableBody(BaseModel):
    '''Request body schema for saving a user's timetable.'''

    selection: dict[str, dict[str, str]]
    locked: list[str]
    skipped: list[str] = []
    modules: list[str] = []
    constraints: list[dict] = []

class FriendRequestCreate(BaseModel):
    '''Request body schema for creating a friend request.'''

    addressee_email: str

class FriendRequestOut(BaseModel):
    '''Response schema for a friend request.'''

    id: int
    requester_id: str
    requester_email: str
    addressee_id: str
    addressee_email: str
    status: str
    created_at: datetime

class FriendOut(BaseModel):
    '''Response schema for accepted friend.'''

    user_id: str
    email: str
    since: datetime

class GroupCreate(BaseModel):
    '''Request body schema for creating a group.'''

    name: str

class GroupOut(BaseModel):
    '''Response schema for a group.'''

    id: int
    name: str
    owner_id: str
    invite_code: str
    created_at: datetime
    member_count: int

class GroupJoinBody(BaseModel):
    '''Request body schema for joining a group.'''

    invite_code: str

class GroupMemberInfo(BaseModel):
    '''Response schema for a group member.'''

    user_id: str
    email: str
    joined_at: datetime

class GroupMemberOut(BaseModel):
    '''Response schema for a group member's timetable, shaped for optimiser.'''

    name: str
    ranked_selections: list[dict[str, dict[str, str]]]

class JointOptimiseRequest(BaseModel):
    group_id: int

class JointMemberResult(BaseModel):
    user_id: str
    email: str
    proposed_selection: dict[str, dict[str, str]]
    current_selection: dict[str, dict[str, str]]
    score: float

class JointSolution(BaseModel):
    members: list[JointMemberResult]

class JointOptimiseResponse(BaseModel):
    solutions: list[JointSolution]

class BatchSelectionUpdate(BaseModel):
    user_id: str
    selection: dict[str, dict[str, str]]

class BatchTimetableUpdateRequest(BaseModel):
    group_id: int
    updates: list[BatchSelectionUpdate]