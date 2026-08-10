'''API endpoints for managing user profiles.'''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Profile
from app.schemas import ProfileOut, ProfileUpdate

router = APIRouter()


@router.get("/profile", response_model=ProfileOut)
def get_profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    '''Retrieve the authenticated user's profile from the database.'''
    profile = db.get(Profile, user["sub"])
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut(
        user_id=profile.user_id,
        email=profile.email,
        display_name=profile.display_name,
    )


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    body: ProfileUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    '''Update the authenticated user's display name.'''
    profile = db.get(Profile, user["sub"])
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.display_name = body.display_name
    db.commit()
    db.refresh(profile)
    return ProfileOut(
        user_id=profile.user_id,
        email=profile.email,
        display_name=profile.display_name,
    )
