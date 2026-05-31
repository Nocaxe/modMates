'''
SQLAlchemy engine and session
'''

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Base for all models to inherit from
class Base(DeclarativeBase):
    pass

def get_engine():
    return create_engine(settings.database_url)

# Dependency for getting DB session in FastAPI routes
def get_db():
    engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()