from pydantic import BaseModel
from typing import Any, Optional

class ResponseModel(BaseModel):
    status: str
    message: Any
    data: Optional[Any] = None

    class Config:
        from_attributes = True