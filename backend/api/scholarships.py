from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Profile
from models.schemas import EligibleScholarship, Scholarship
from services.dataset_service import load_scholarships
from services.eligibility_service import get_eligible_scholarships

router = APIRouter(tags=["scholarships"])


@router.get("/scholarships", response_model=list[Scholarship])
def list_scholarships():
    return load_scholarships()


@router.get("/eligible-scholarships", response_model=list[EligibleScholarship])
def eligible_scholarships(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile first")
    return get_eligible_scholarships(profile)
