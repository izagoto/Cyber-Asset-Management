import typing
from fastapi import APIRouter, Header, HTTPException, status
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth_service import AuthService
from app.core.paseto import create_access_token
from app.schemas.response import StandardResponse
from app.models.blacklisted_token import BlacklistedToken

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)


@router.post("/login", response_model=StandardResponse[LoginResponse])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = AuthService.authenticate(
        db,
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(
        user.id, 
        user.role
    )

    return StandardResponse(
        status="success",
        message="Login successful",
        data={
            "access_token": token,
            "token_type": "Bearer"
        }
    )


@router.post("/logout", response_model=StandardResponse[dict])
def logout(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if authorization:
        token = authorization.replace("Bearer ", "")
        
        # Check if already blacklisted to avoid unique constraint error
        existing = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
        if not existing:
            blacklisted = BlacklistedToken(token=token)
            db.add(blacklisted)
            db.commit()

    return StandardResponse(
        status="success",
        message="Logged out successfully",
        data=None
    )