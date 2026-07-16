'''API endpoints for managing groups.'''
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Group, GroupMembership, Profile, UserTimetable
from app.schemas import GroupCreate, GroupOut, GroupJoinBody, GroupMemberInfo, GroupMemberOut   

router = APIRouter()