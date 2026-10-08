from typing import Optional, List
import uuid
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

class UserRepository:
    def get_by_id(self, db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: UserCreate, hashed_password: str) -> User:
        db_user = User(
            id=f"usr-{uuid.uuid4().hex[:8]}",
            email=obj_in.email,
            hashed_password=hashed_password,
            name=obj_in.name,
            role=obj_in.role,
            phone=obj_in.phone,
            ward=obj_in.ward,
            department_id=obj_in.department_id,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

user_repo = UserRepository()
