from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.rbac import require_role
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.loan import LoanCreate, LoanResponse
from app.services.loan_service import LoanService
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.post("", response_model=StandardResponse[LoanResponse], status_code=status.HTTP_201_CREATED)
def request_loan(
    loan_in: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request to borrow an asset (Any user)"""
    loan = LoanService.request_loan(db, loan_in, current_user.id)
    return StandardResponse(status="success", message="Loan requested", data=loan)

@router.get("", response_model=StandardResponse[List[LoanResponse]])
def get_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get loans (Admin gets all, regular user gets their own)"""
    if current_user.role in ["ADMIN", "SUPERVISOR"]:
        loans = LoanService.get_all_loans(db)
    else:
        loans = LoanService.get_user_loans(db, current_user.id)
    return StandardResponse(status="success", message="Loans retrieved", data=loans)

@router.get("/my-loans", response_model=StandardResponse[List[LoanResponse]])
def get_my_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get loans for current user"""
    loans = LoanService.get_user_loans(db, current_user.id)
    return StandardResponse(status="success", message="User loans retrieved", data=loans)

@router.get("/all", response_model=StandardResponse[List[LoanResponse]])
def get_all_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Get all loans (Admin only)"""
    loans = LoanService.get_all_loans(db)
    return StandardResponse(status="success", message="All loans retrieved", data=loans)

class LoanStatusUpdate(BaseModel):
    status: str

@router.patch("/{loan_id}", response_model=StandardResponse[LoanResponse])
def update_loan_status(
    loan_id: int,
    payload: LoanStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update loan status manually (Admin for active/reject, borrower/admin for return)"""
    from app.models.loan import Loan, LoanStatus
    from app.models.asset import Asset, AssetStatus
    from datetime import datetime, timezone
    
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    status_val = payload.status.upper()
    
    # Enforce RBAC
    if status_val in ["ACTIVE", "REJECTED"]:
        if current_user.role not in ["ADMIN", "SUPERVISOR"]:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif status_val == "RETURNED":
        if current_user.role not in ["ADMIN", "SUPERVISOR"] and loan.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        raise HTTPException(status_code=400, detail="Invalid status update")
        
    if status_val == "ACTIVE":
        loan.status = LoanStatus.ACTIVE.value
        loan.approved_at = datetime.now(timezone.utc)
        # Check if asset should be marked as BORROWED
        asset = db.query(Asset).filter(Asset.id == loan.asset_id).first()
        if asset:
            # Refresh to ensure we calculate available_quantity correctly with the new loan state
            db.commit()
            db.refresh(asset)
            if asset.available_quantity <= 0:
                asset.status = AssetStatus.BORROWED.value
                db.add(asset)
    elif status_val == "REJECTED":
        loan.status = LoanStatus.REJECTED.value
    elif status_val == "RETURNED":
        loan.status = LoanStatus.RETURNED.value
        loan.returned_at = datetime.now(timezone.utc)
        # Mark asset as AVAILABLE since at least some quantity was returned
        asset = db.query(Asset).filter(Asset.id == loan.asset_id).first()
        if asset:
            if asset.status == AssetStatus.BORROWED.value:
                asset.status = AssetStatus.AVAILABLE.value
                db.add(asset)
        
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return StandardResponse(status="success", message=f"Loan status updated to {status_val}", data=loan)

@router.patch("/{loan_id}/approve", response_model=StandardResponse[LoanResponse])
def approve_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Approve a loan request (Admin only)"""
    loan = LoanService.approve_loan(db, loan_id, current_user.id)
    return StandardResponse(status="success", message="Loan approved", data=loan)
