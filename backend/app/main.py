'''
FastAPI application entry point
'''

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.routers import modules
from .auth import get_current_user

app = FastAPI(title="modMates API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(modules.router)

@app.get("/health")
def health_check():
    '''Health check endpoint to verify the API is running.'''
    return {"status": "ok"}

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    '''Health check endpoint to verify database connectivity.'''
    try:
        # Ask the DB to return 1 and check if it succeeds
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "details": str(e)}

# Test endpoint for authentication
@app.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    '''Endpoint to retrieve the authenticated user's profile.'''
    return {"user_id": user["sub"], "email": user.get("email")}