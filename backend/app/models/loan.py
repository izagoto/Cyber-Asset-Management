from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
import enum

from app.core.database import Base


class LoanStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    RETURNED = "RETURNED"
    REJECTED = "REJECTED"
    OVERDUE = "OVERDUE"



class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False)
    borrower_id: Mapped[int] = mapped_column(Integer, ForeignKey("borrowers.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=LoanStatus.REQUESTED.value)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(String(500))
    purpose: Mapped[Optional[str]] = mapped_column(String(500))

    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    returned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    asset = relationship("Asset", back_populates="loans")
    borrower = relationship("Borrower", backref="loans")
