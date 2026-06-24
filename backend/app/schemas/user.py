from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    fullname: str
    role: str = "Admin"
    division: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    role: Optional[str] = None
    division: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="Password must be at least 6 characters")

class UserResponse(UserBase):
    id: int
    create_at: datetime

    class Config:
        from_attributes = True
