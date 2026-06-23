from fastapi import Depends
from fastapi import HTTPException

from app.middleware.auth import get_current_user


def require_role(
    role: str
):

    def role_checker(
        current_user=Depends(
            get_current_user
        )
    ):

        if current_user.role != role:
            raise HTTPException(
                status_code=403,
                detail="Forbidden"
            )

        return current_user

    return role_checker