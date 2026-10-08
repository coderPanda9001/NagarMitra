from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TeamBase(BaseModel):
    department_id: str
    name: str
    leader_name: Optional[str] = None
    ward: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamOut(TeamBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
