from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:

    @staticmethod
    def get_by_email(
        db: Session,
        email: str
    ):
        return (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int
    ):
        return (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ):
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create(
        db: Session,
        user_data: dict
    ):
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(
        db: Session,
        user_id: int,
        update_data: dict
    ):
        user = UserRepository.get_by_id(db, user_id)
        if user:
            for key, value in update_data.items():
                setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def delete(
        db: Session,
        user_id: int
    ):
        user = UserRepository.get_by_id(db, user_id)
        if user:
            db.delete(user)
            db.commit()
        return user