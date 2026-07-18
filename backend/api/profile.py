from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Profile
from models.schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile created yet")
    return profile


@router.post("", response_model=ProfileOut)
def create_or_update_profile(payload: ProfileIn, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = Profile(**payload.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
