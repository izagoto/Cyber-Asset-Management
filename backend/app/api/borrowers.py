from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_

from app.core.database import get_db
from app.core.rbac import require_role
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.borrower import Borrower
from app.schemas.borrower import BorrowerCreate, BorrowerUpdate, BorrowerResponse
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/api/v1/borrowers", tags=["Borrowers"])


@router.get("", response_model=StandardResponse[List[BorrowerResponse]])
def get_borrowers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"])),
    search: Optional[str] = Query(None, description="Search borrowers by name, division, phone, or email")
):
    """Get all borrowers (Admin only)"""
    query = db.query(Borrower)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Borrower.name.ilike(pattern),
                Borrower.division.ilike(pattern),
                Borrower.phone.ilike(pattern),
                Borrower.email.ilike(pattern)
            )
        )
    borrowers = query.order_by(Borrower.id).all()
    return StandardResponse(status="success", message="Borrowers retrieved", data=borrowers)


@router.get("/active", response_model=StandardResponse[List[BorrowerResponse]])
def get_active_borrowers(
    db: Session = Depends(get_db),
):
    """Get active borrowers for dropdowns"""
    borrowers = db.query(Borrower).filter(Borrower.is_active == True).order_by(Borrower.id).all()
    return StandardResponse(status="success", message="Active borrowers retrieved", data=borrowers)


@router.get("/{borrower_id}", response_model=StandardResponse[BorrowerResponse])
def get_borrower(
    borrower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Get a specific borrower (Admin only)"""
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")
    return StandardResponse(status="success", message="Borrower retrieved", data=borrower)


@router.post("", response_model=StandardResponse[BorrowerResponse], status_code=status.HTTP_201_CREATED)
def create_borrower(
    borrower_in: BorrowerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Create a new borrower (Admin only)"""
    borrower = Borrower(**borrower_in.model_dump())
    db.add(borrower)
    db.commit()
    db.refresh(borrower)
    return StandardResponse(status="success", message="Borrower created", data=borrower)


@router.patch("/{borrower_id}", response_model=StandardResponse[BorrowerResponse])
def update_borrower(
    borrower_id: int,
    borrower_in: BorrowerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Update a borrower (Admin only)"""
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")
    
    update_data = borrower_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(borrower, field, value)
    
    db.commit()
    db.refresh(borrower)
    return StandardResponse(status="success", message="Borrower updated", data=borrower)


@router.delete("/{borrower_id}", response_model=StandardResponse)
def delete_borrower(
    borrower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Delete a borrower (Admin only)"""
    borrower = db.query(Borrower).filter(Borrower.id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail="Borrower not found")
    
    db.delete(borrower)
    db.commit()
    return StandardResponse(status="success", message="Borrower deleted", data=None)
