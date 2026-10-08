from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    department_id: Optional[str] = None
    default_sla_hours: int = 24
    default_priority: str = "Medium"

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
