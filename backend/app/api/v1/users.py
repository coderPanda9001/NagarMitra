from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import UserRole, User
from app.schemas.user import UserOut
from app.repositories.user_repository import user_repo

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserOut])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.Admin, UserRole.Authority]))
):
    users = user_repo.get_all(db, skip=skip, limit=limit)
    return [UserOut.model_validate(u) for u in users]
