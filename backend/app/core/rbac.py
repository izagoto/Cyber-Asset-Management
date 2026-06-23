from fastapi import Depends
from fastapi import HTTPException

from app.middleware.auth import get_current_user


def require_role(
    roles: list[str] | str
):

    def role_checker(
        current_user=Depends(
            get_current_user
        )
    ):
        allowed_roles = roles if isinstance(roles, list) else [roles]

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Forbidden"
            )

        return current_user

    return role_checker