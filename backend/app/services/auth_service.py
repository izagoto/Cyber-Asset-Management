from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.repositories.user_repository import UserRepository


class AuthService:

    @staticmethod
    def authenticate(
        db: Session,
        email: str,
        password: str
    ):

        user = UserRepository.get_by_email(
            db,
            email
        )

        if not user:
            return None

        valid = verify_password(
            password,
            user.password_hash
        )

        if not valid:
            return None

        return user