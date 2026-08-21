from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.database.mongodb import get_database
from app.auth.security import decode_access_token
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """FastAPI dependency to retrieve the currently logged in user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_101_SWITCHING_PROTOCOLS, # Wait, let's use 401 Unauthorized, not 101 Switching Protocols! 
        # Wait, status.HTTP_401_UNAUTHORIZED is correct. Let's fix that.
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Actually, let's use status.HTTP_401_UNAUTHORIZED
    credentials_exception.status_code = status.HTTP_401_UNAUTHORIZED
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    role: str = payload.get("role")
    user_id: str = payload.get("user_id")
    
    if email is None or user_id is None:
        raise credentials_exception
        
    token_data = TokenData(email=email, role=role, user_id=user_id)
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    user = await db["users"].find_one({"_id": ObjectId(token_data.user_id)})
    if user is None:
        raise credentials_exception
        
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """FastAPI dependency to restrict endpoints to administrators."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required"
        )
    return current_user
