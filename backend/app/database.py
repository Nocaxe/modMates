'''
SQLAlchemy engine and session
'''

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Base for all models to inherit from
class Base(DeclarativeBase):
    '''Base class for SQLAlchemy models.'''

# Single engine instance shared across all requests.
# pool_size + max_overflow must stay within Supabase's session-mode limit (15).
engine = create_engine(
    settings.database_url,
    pool_size=2,
    max_overflow=4,
)

SessionLocal = sessionmaker(bind=engine)

# Dependency for getting DB session in FastAPI routes
def get_db():
    '''Provides a database session for FastAPI routes'''
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()