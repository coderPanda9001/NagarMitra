from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DepartmentBase(BaseModel):
    name: str
    code: str
    head_name: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
