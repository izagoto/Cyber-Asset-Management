from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, cast

from app.core.database import get_db
from app.core.rbac import require_role
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.services.asset_service import AssetService
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=StandardResponse[List[AssetResponse]])
def get_assets(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get all assets (Admin only)"""
    assets = AssetService.get_all(db, skip=skip, limit=limit)
    return StandardResponse(status="success", message="Assets retrieved", data=assets)

@router.post("", response_model=StandardResponse[AssetResponse], status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Create a new asset (Admin only)"""
    asset = AssetService.create(db, asset_in, cast(int, current_user.id))
    return StandardResponse(status="success", message="Asset created", data=asset)

@router.get("/{asset_id}", response_model=StandardResponse[AssetResponse])
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Get a specific asset (Admin only)"""
    asset = AssetService.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return StandardResponse(status="success", message="Asset retrieved", data=asset)

@router.patch("/{asset_id}", response_model=StandardResponse[AssetResponse])
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN"))
):
    """Update an asset (Admin only)"""
    asset = AssetService.update(db, asset_id, asset_in, cast(int, current_user.id))
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return StandardResponse(status="success", message="Asset updated", data=asset)

# End of routes
