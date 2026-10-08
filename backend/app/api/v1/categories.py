from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [CategoryOut.model_validate(c) for c in cats]
