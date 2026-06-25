from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_

from app.core.database import get_db
from app.core.rbac import require_role
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])


@router.get("", response_model=StandardResponse[List[CategoryResponse]])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"])),
    search: Optional[str] = Query(None, description="Search categories by name")
):
    """Get all categories (Admin only)"""
    query = db.query(Category)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    categories = query.order_by(Category.id).all()
    return StandardResponse(status="success", message="Categories retrieved", data=categories)


@router.get("/active", response_model=StandardResponse[List[str]])
def get_active_categories(
    db: Session = Depends(get_db),
):
    """Get active category names for dropdowns"""
    categories = db.query(Category).filter(Category.is_active == True).order_by(Category.id).all()
    return StandardResponse(status="success", message="Active categories retrieved", data=[c.name for c in categories])


@router.get("/{category_id}", response_model=StandardResponse[CategoryResponse])
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Get a specific category (Admin only)"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return StandardResponse(status="success", message="Category retrieved", data=category)


def normalize_category_name(name: str) -> str:
    return name.strip().title()

@router.post("", response_model=StandardResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Create a new category (Admin only)"""
    normalized_name = normalize_category_name(category_in.name)
    existing = db.query(Category).filter(Category.name.ilike(normalized_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{normalized_name}' already exists")
    
    category = Category(
        name=normalized_name,
        description=category_in.description.strip() if category_in.description else None,
        is_active=category_in.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return StandardResponse(status="success", message="Category created", data=category)


@router.patch("/{category_id}", response_model=StandardResponse[CategoryResponse])
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Update a category (Admin only)"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"]:
        normalized_name = normalize_category_name(update_data["name"])
        existing = db.query(Category).filter(Category.name.ilike(normalized_name), Category.id != category_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Category '{normalized_name}' already exists")
        update_data["name"] = normalized_name
    if "description" in update_data and update_data["description"]:
        update_data["description"] = update_data["description"].strip()
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return StandardResponse(status="success", message="Category updated", data=category)


@router.delete("/{category_id}", response_model=StandardResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "SUPERVISOR"]))
):
    """Delete a category (Admin only)"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return StandardResponse(status="success", message="Category deleted", data=None)
