from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    ward: Optional[str] = None
    department_id: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.Citizen

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    ward: Optional[str] = None
    department_id: Optional[str] = None
    role: Optional[UserRole] = None

class UserOut(UserBase):
    id: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True
