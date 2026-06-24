from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
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
        require_role(["ADMIN", "SUPERVISOR"])
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
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
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
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """List all users (Admin only)"""
    users = UserRepository.get_all(db, skip=skip, limit=limit)
    return StandardResponse(
        status="success",
        message="Users retrieved successfully",
        data=users
    )


@router.patch("/{user_id}", response_model=StandardResponse[UserResponse])
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Update user details (Admin only)"""
    user = UserRepository.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        if verify_password(update_data["password"], user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as the old password"
            )
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")
        
    updated_user = UserRepository.update(db, user_id=user_id, update_data=update_data)
    
    return StandardResponse(
        status="success",
        message="User updated successfully",
        data=updated_user
    )


@router.delete("/{user_id}", response_model=StandardResponse[dict])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Delete a user (Admin only)"""
    user = UserRepository.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    UserRepository.delete(db, user_id=user_id)
    
    return StandardResponse(
        status="success",
        message="User deleted successfully",
        data=None
    )


from app.services.loan_service import LoanService

@router.get("/{user_id}/logs", response_model=StandardResponse[list])
def get_user_logs(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Get loan history for a specific user (Admin only)"""
    user = UserRepository.get_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    loans = LoanService.get_user_loans(db, user_id=user_id)
    
    return StandardResponse(
        status="success",
        message="User logs retrieved successfully",
        data=loans
    )
