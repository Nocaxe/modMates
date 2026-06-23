'''Authentication utilities for FastAPI.'''
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from .config import settings

security = HTTPBearer()

def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    '''Extracts and validates the JWT token from the Authorization header.'''

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.supabase_public_key["keys"][0],
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
