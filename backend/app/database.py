'''
SQLAlchemy engine and session
'''

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Base for all models to inherit from
class Base(DeclarativeBase):
    '''Base class for SQLAlchemy models.'''

def get_engine():
    '''Creates and returns a SQLAlchemy engine using the database URL from settings.'''
    return create_engine(settings.database_url)

# Dependency for getting DB session in FastAPI routes
def get_db():
    '''Provides a database session for FastAPI routes'''
    engine = get_engine()
    session_local = sessionmaker(bind=engine)
    db = session_local()
    try:
        yield db
    finally:
        db.close()