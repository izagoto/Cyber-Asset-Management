from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Optional, cast

from app.models.loan import Loan, LoanStatus
from app.models.asset import Asset, AssetStatus
from app.schemas.loan import LoanCreate

class LoanService:
    @staticmethod
    def request_loan(db: Session, loan_in: LoanCreate, current_user_id: int):
        asset = db.query(Asset).filter(Asset.id == loan_in.asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        # Calculate available quantity
        borrowed_qty = db.query(func.sum(Loan.quantity)).filter(
            Loan.asset_id == asset.id,
            Loan.status.in_([LoanStatus.REQUESTED.value, LoanStatus.APPROVED.value, LoanStatus.ACTIVE.value, LoanStatus.OVERDUE.value])
        ).scalar() or 0
        
        available_qty = asset.quantity - borrowed_qty
        
        if available_qty < loan_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient quantity available. Only {available_qty} left.")
        
# Use provided borrower_id or default to current user
        borrower_id = loan_in.borrower_id if loan_in.borrower_id is not None else current_user_id
            
        db_loan = Loan(
            asset_id=loan_in.asset_id,
            borrower_id=borrower_id,
            notes=loan_in.notes,
            purpose=loan_in.purpose,
            status=LoanStatus.REQUESTED.value,
            quantity=loan_in.quantity
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        
        # Reload with borrower
        stmt = select(Loan).where(Loan.id == db_loan.id).options(selectinload(Loan.borrower))
        result = db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    def get_user_loans(db: Session, user_id: int):
        stmt = select(Loan).where(Loan.borrower_id == user_id).options(selectinload(Loan.borrower))
        result = db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    def get_all_loans(db: Session):
        stmt = select(Loan).options(selectinload(Loan.borrower))
        result = db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    def approve_loan(db: Session, loan_id: int, user_id: int):
        loan = cast(Loan, db.query(Loan).filter(Loan.id == loan_id).first())
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        if loan.status != LoanStatus.REQUESTED.value:
            raise HTTPException(status_code=400, detail="Loan is not in requested status")
            
        loan.status = LoanStatus.APPROVED.value
        loan.approved_at = datetime.now(timezone.utc)
        db.add(loan)
        db.commit()
        db.refresh(loan)
        
        return loan

