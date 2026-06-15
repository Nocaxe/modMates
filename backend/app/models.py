"""Defines the database models for the application."""

from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base


class Profile(Base):
    """User profile model representing a user in the system."""

    __tablename__ = "profiles"
    user_id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


class UserTimetable(Base):
    """Model representing a user's timetable selection."""

    __tablename__ = "user_timetables"
    user_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), primary_key=True
    )
    selection = Column(JSONB, nullable=False, server_default=text("'{}'"))
    locked = Column(JSONB, nullable=False, server_default=text("'{}'"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))
