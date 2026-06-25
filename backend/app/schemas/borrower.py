from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class BorrowerBase(BaseModel):
    name: str
    division: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True


class BorrowerCreate(BorrowerBase):
    pass


class BorrowerUpdate(BaseModel):
    name: Optional[str] = None
    division: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class BorrowerResponse(BorrowerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
