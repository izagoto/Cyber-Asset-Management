from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Optional, cast

from app.models.loan import Loan, LoanStatus
from app.models.asset import Asset, AssetStatus
from app.schemas.loan import LoanCreate

class LoanService:
    @staticmethod
    def request_loan(db: Session, loan_in: LoanCreate, user_id: int):
        asset = db.query(Asset).filter(Asset.id == loan_in.asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
            
        # Calculate available quantity
        from sqlalchemy import func
        borrowed_qty = db.query(func.sum(Loan.quantity)).filter(
            Loan.asset_id == asset.id,
            Loan.status.in_([LoanStatus.REQUESTED.value, LoanStatus.APPROVED.value, LoanStatus.ACTIVE.value, LoanStatus.OVERDUE.value])
        ).scalar() or 0
        
        available_qty = asset.quantity - borrowed_qty
        
        if available_qty < loan_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient quantity available. Only {available_qty} left.")
            
        db_loan = Loan(
            asset_id=loan_in.asset_id,
            user_id=user_id,
            notes=loan_in.notes,
            purpose=loan_in.purpose,
            status=LoanStatus.REQUESTED.value,
            quantity=loan_in.quantity
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        
        return db_loan

    @staticmethod
    def get_user_loans(db: Session, user_id: int):
        return db.query(Loan).filter(Loan.user_id == user_id).all()

    @staticmethod
    def get_all_loans(db: Session):
        return db.query(Loan).all()

    @staticmethod
    def approve_loan(db: Session, loan_id: int, user_id: int):
        loan = cast(Loan, db.query(Loan).filter(Loan.id == loan_id).first())
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        if loan.status != LoanStatus.REQUESTED.value:  # type: ignore
            raise HTTPException(status_code=400, detail="Loan is not in requested status")
            
        loan.status = LoanStatus.APPROVED.value  # type: ignore
        loan.approved_at = datetime.now(timezone.utc)  # type: ignore
        db.add(loan)
        db.commit()
        db.refresh(loan)
        
        return loan

