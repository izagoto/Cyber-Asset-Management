from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.loan import LoanStatus
from app.schemas.borrower import BorrowerResponse

class LoanBase(BaseModel):
    asset_id: int
    notes: Optional[str] = None
    purpose: Optional[str] = None
    quantity: int = 1

class LoanCreate(LoanBase):
    borrower_id: Optional[int] = None

class LoanResponse(LoanBase):
    id: int
    borrower_id: int
    borrower: Optional[BorrowerResponse] = None
    status: LoanStatus
    requested_at: datetime
    approved_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    purpose: Optional[str] = None

    class Config:
        from_attributes = True
