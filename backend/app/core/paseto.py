from datetime import datetime, timezone
from datetime import timedelta

import pyseto

from app.core.config import settings


def create_access_token(
    user_id: int,
    role: str
):

    exp = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": exp.isoformat()
    }

    key = pyseto.Key.new(
        version=4,
        purpose="local",
        key=settings.PASETO_SECRET_KEY.encode()
    )

    token = pyseto.encode(
        key,
        payload
    )

    return token.decode()

def decode_token(token: str):

    key = pyseto.Key.new(
        version=4,
        purpose="local",
        key=settings.PASETO_SECRET_KEY.encode()
    )

    decoded = pyseto.decode(
        key,
        token
    )

    payload = decoded.payload

    if isinstance(payload, bytes):
        import json
        payload = json.loads(
            payload.decode()
        )

    exp = datetime.fromisoformat(
        payload["exp"]
    )

    if datetime.now(timezone.utc) > exp:
        raise Exception(
            "Token expired"
        )

    return payload