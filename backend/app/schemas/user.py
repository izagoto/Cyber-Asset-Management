from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    fullname: str
    role: str = "ADMIN"
    division: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    role: Optional[str] = None
    division: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    create_at: datetime

    class Config:
        from_attributes = True
