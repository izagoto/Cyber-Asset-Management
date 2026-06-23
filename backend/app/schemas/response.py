from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    status: str
    message: str
    data: Optional[T] = None
    meta: Optional[dict] = None
