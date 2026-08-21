from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database.mongodb import get_database
from app.auth.security import hash_password, verify_password, create_access_token
from app.schemas.user import UserRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection offline"
        )
        
    # Check if email already registered
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Hash password
    hashed_pwd = hash_password(user_data.password)
    
    # Create user document
    new_user = {
        "email": user_data.email,
        "hashed_password": hashed_pwd,
        "full_name": user_data.full_name,
        "role": user_data.role if user_data.role in ["engineer", "admin"] else "engineer",
        "created_at": datetime.now(timezone.utc)
    }
    
    # Insert document
    result = await db["users"].insert_one(new_user)
    
    # Retrieve inserted document
    inserted_user = await db["users"].find_one({"_id": result.inserted_id})
    
    # Log activity
    await db["activity_logs"].insert_one({
        "user_id": result.inserted_id,
        "action": "USER_REGISTRATION",
        "details": f"User {user_data.email} registered successfully.",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return inserted_user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection offline"
        )
        
    # Find user
    user = await db["users"].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        # Log failed login attempt
        await db["activity_logs"].insert_one({
            "action": "LOGIN_FAILURE",
            "details": f"Failed login attempt for email {credentials.email}.",
            "timestamp": datetime.now(timezone.utc)
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate token
    token_data = {
        "sub": user["email"],
        "role": user["role"],
        "user_id": str(user["_id"])
    }
    access_token = create_access_token(data=token_data)
    
    # Log successful login
    await db["activity_logs"].insert_one({
        "user_id": user["_id"],
        "action": "LOGIN_SUCCESS",
        "details": f"User {user['email']} logged in successfully.",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"access_token": access_token, "token_type": "bearer"}
