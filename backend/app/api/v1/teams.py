from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.team import Team
from app.schemas.team import TeamOut

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("/", response_model=List[TeamOut])
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [TeamOut.model_validate(t) for t in teams]
