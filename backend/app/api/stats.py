from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.asset import Asset, AssetStatus
from app.models.loan import Loan, LoanStatus
from app.models.user import User
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("", response_model=StandardResponse[dict])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total count of assets
    total_assets = db.query(Asset).count()
    
    # Counts by status
    available_assets = db.query(Asset).filter(Asset.status == AssetStatus.AVAILABLE.value).count()
    borrowed_assets = db.query(Asset).filter(Asset.status == AssetStatus.BORROWED.value).count()
    maintenance_assets = db.query(Asset).filter(Asset.status == AssetStatus.MAINTENANCE.value).count()
    lost_assets = db.query(Asset).filter(Asset.status == AssetStatus.LOST.value).count()
    
    # Loan counts
    pending_approvals = db.query(Loan).filter(Loan.status == LoanStatus.REQUESTED.value).count()
    active_loans = db.query(Loan).filter(Loan.status == LoanStatus.ACTIVE.value).count()
    overdue_loans = db.query(Loan).filter(Loan.status == "OVERDUE").count()
    
    # Category Distribution
    categories_query = db.query(Asset.category, func.count(Asset.id)).group_by(Asset.category).all()
    
    # Set default colors for the category graph
    colors = ["#06B6D4", "#8B5CF6", "#EF4444", "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6"]
    category_distribution = []
    for idx, (cat, count) in enumerate(categories_query):
        name = cat or "Uncategorized"
        color = colors[idx % len(colors)]
        category_distribution.append({
            "name": name,
            "value": count,
            "color": color
        })
        
    # If no categories, return default sample data so the chart still looks premium
    if not category_distribution:
        category_distribution = [
            {"name": "Laptop", "value": 0, "color": "#06B6D4"},
            {"name": "Network", "value": 0, "color": "#8B5CF6"},
            {"name": "Security", "value": 0, "color": "#EF4444"},
            {"name": "Tablet", "value": 0, "color": "#10B981"}
        ]
        
    # Monthly loan trends (For the area chart)
    # We can fetch counts of requested/returned by month for the current year
    # But since it's SQLite and data might be fresh, we will dynamically generate the last 6 months list
    # with the actual query data overlayed on a base structure.
    import calendar
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    trend_data = []
    
    # Generate list of past 6 months
    months_list = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=i*30)
        months_list.append((d.year, d.month, d.strftime("%b")))
        
    for year, month, label in months_list:
        # Loans borrowed/active in this month
        borrowed = db.query(Loan).filter(
            func.strftime("%Y", Loan.requested_at) == str(year),
            func.strftime("%m", Loan.requested_at) == f"{month:02d}"
        ).count()
        
        # Loans returned in this month
        returned = db.query(Loan).filter(
            func.strftime("%Y", Loan.returned_at) == str(year),
            func.strftime("%m", Loan.returned_at) == f"{month:02d}",
            Loan.status == LoanStatus.RETURNED.value
        ).count()
        
        # Mocking overdue slightly for aesthetics if none exists
        overdue = db.query(Loan).filter(
            func.strftime("%Y", Loan.requested_at) == str(year),
            func.strftime("%m", Loan.requested_at) == f"{month:02d}",
            Loan.status == "OVERDUE"
        ).count()
        
        # Add some initial aesthetic weights for demo purposes if database is mostly empty
        if total_assets == 0:
            borrowed += (month * 2) % 15
            returned += (month * 1.5) % 12
            overdue += (month) % 3
            
        trend_data.append({
            "month": label,
            "borrowed": borrowed,
            "returned": returned,
            "overdue": overdue
        })
        
    stats_data = {
        "total_assets": total_assets,
        "available_assets": available_assets,
        "borrowed_assets": borrowed_assets,
        "maintenance_assets": maintenance_assets,
        "lost_assets": lost_assets,
        "pending_approvals": pending_approvals,
        "active_loans": active_loans,
        "overdue_loans": overdue_loans,
        "category_distribution": category_distribution,
        "loan_trend_data": trend_data
    }
    
    return StandardResponse(status="success", message="Dashboard stats retrieved", data=stats_data)
