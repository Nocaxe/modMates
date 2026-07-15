"""Defines the database models for the application."""

import secrets

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base


class Profile(Base):
    """User profile model representing a user in the system."""

    __tablename__ = "profiles"
    user_id = Column(String, primary_key=True)
    email = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


class UserTimetable(Base):
    """Model representing a user's timetable selection."""

    __tablename__ = "user_timetables"
    user_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), primary_key=True
    )
    selection = Column(JSONB, nullable=False, server_default=text("'{}'"))
    locked = Column(JSONB, nullable=False, server_default=text("'[]'"))
    modules = Column(JSONB, nullable=False, server_default=text("'[]'"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))


class Friendship(Base):
    """Model representing a friend request/relationship between two users."""

    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True, autoincrement=True)
    requester_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    addressee_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    status = Column(String, nullable=False, server_default=text("'pending'"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    __table_args__ = (UniqueConstraint("requester_id", "addressee_id"),)


class Group(Base):
    """Model representing a group of users optimising a timetable together."""

    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    owner_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), nullable=False
    )
    invite_code = Column(
        String, unique=True, nullable=False, default=lambda: secrets.token_urlsafe(6)
    )
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))


class GroupMembership(Base):
    """Model representing a user's membership in a group."""

    __tablename__ = "group_members"
    group_id = Column(
        Integer, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True
    )
    user_id = Column(
        String, ForeignKey("profiles.user_id", ondelete="CASCADE"), primary_key=True
    )
    joined_at = Column(DateTime(timezone=True), server_default=text("now()"))
