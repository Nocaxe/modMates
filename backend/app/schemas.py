'''Schemas for the API endpoints.'''
from datetime import datetime
from pydantic import BaseModel

class TimetableBody(BaseModel):
    '''Request body schema for saving a user's timetable.'''

    selection: dict[str, dict[str, str]]
    locked: list[str]
    modules: list[str] = []

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