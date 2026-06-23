from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

class AssetService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Asset).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, asset_id: int):
        return db.query(Asset).filter(Asset.id == asset_id).first()

    @staticmethod
    def create(db: Session, asset_in: AssetCreate, user_id: int):
        db_asset = Asset(
            name=asset_in.name,
            category=asset_in.category,
            serial_number=asset_in.serial_number,
            description=asset_in.description
        )
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        
        return db_asset

    @staticmethod
    def update(db: Session, asset_id: int, asset_in: AssetUpdate, user_id: int):
        db_asset = AssetService.get_by_id(db, asset_id)
        if not db_asset:
            return None
            
        update_data = asset_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_asset, key, value)
            
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        
        return db_asset
