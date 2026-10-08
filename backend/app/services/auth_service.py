from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import user_repo
from app.core.security import verify_password, hash_password, create_access_token
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserOut

class AuthService:
    def authenticate(self, db: Session, login_data: LoginRequest) -> Token:
        user = user_repo.get_by_email(db, email=login_data.email)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(subject=user.id)
        return Token(access_token=access_token, user=UserOut.model_validate(user))

    def register(self, db: Session, user_in: UserCreate) -> UserOut:
        existing = user_repo.get_by_email(db, email=user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        hashed_pwd = hash_password(user_in.password)
        new_user = user_repo.create(db, obj_in=user_in, hashed_password=hashed_pwd)
        return UserOut.model_validate(new_user)

auth_service = AuthService()
