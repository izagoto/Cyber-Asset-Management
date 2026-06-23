from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.asset import AssetStatus

class AssetBase(BaseModel):
    name: str
    category: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[AssetStatus] = None

class AssetResponse(AssetBase):
    id: int
    status: AssetStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
