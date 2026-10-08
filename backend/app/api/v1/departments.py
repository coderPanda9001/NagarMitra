from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentOut

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("/", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [DepartmentOut.model_validate(d) for d in depts]
