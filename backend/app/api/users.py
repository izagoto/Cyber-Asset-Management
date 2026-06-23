from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import hash_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User

from app.middleware.auth import (
    get_current_user
)
from app.core.rbac import require_role
from app.schemas.response import StandardResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=StandardResponse[dict])
def me(
    current_user=Depends(
        get_current_user
    )
):

    return StandardResponse(
        status="success",
        message="Current user retrieved",
        data={
            "id": current_user.id,
            "email": current_user.email,
            "fullname": current_user.fullname,
            "role": current_user.role
        }
    )


@router.get("/admin", response_model=StandardResponse[dict])
def admin_area(
    current_user=Depends(
        require_role("ADMIN")
    )
):

    return StandardResponse(
        status="success",
        message="Welcome Admin",
        data=None
    )


@router.post("", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Create a new user (Admin only)"""
    existing_user = UserRepository.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_data = user_in.model_dump()
    user_data["password_hash"] = hash_password(user_data.pop("password"))
    
    new_user = UserRepository.create(db, user_data)
    return StandardResponse(
        status="success",
        message="User created successfully",
        data=new_user
    )


@router.get("", response_model=StandardResponse[List[UserResponse]])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """List all users (Admin only)"""
    users = UserRepository.get_all(db, skip=skip, limit=limit)
    return StandardResponse(
        status="success",
        message="Users retrieved successfully",
        data=users
    )
