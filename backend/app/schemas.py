'''Schemas for the API endpoints.'''
from pydantic import BaseModel

class TimetableBody(BaseModel):
    '''Request body schema for saving a user's timetable.'''
    
    selection: dict[str, dict[str, str]]
    locked: list[str]