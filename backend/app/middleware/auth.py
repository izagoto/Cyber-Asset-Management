from fastapi import Depends
from fastapi import HTTPException
from fastapi import Header

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.paseto import decode_token

from app.models.blacklisted_token import BlacklistedToken
from app.repositories.user_repository import UserRepository


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    try:

        token = authorization.replace(
            "Bearer ",
            ""
        )

        is_blacklisted = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
        if is_blacklisted:
            raise HTTPException(status_code=401, detail="Token has been revoked")

        payload = decode_token(
            token
        )

        user = (
            UserRepository.get_by_id(
                db,
                int(payload["sub"])
            )
        )

        if not user:
            raise Exception()

        return user

    except HTTPException as he:
        raise he
    except Exception as e:
        if str(e) == "Token expired":
            raise HTTPException(
                status_code=401,
                detail="Token expired"
            )
        print(f"Auth error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )