from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.loan import LoanStatus
from app.schemas.user import UserResponse

class LoanBase(BaseModel):
    asset_id: int
    notes: Optional[str] = None
    purpose: Optional[str] = None
    quantity: int = 1

class LoanCreate(LoanBase):
    user_id: Optional[int] = None

class LoanResponse(LoanBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None
    status: LoanStatus
    requested_at: datetime
    approved_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    purpose: Optional[str] = None

    class Config:
        from_attributes = True
