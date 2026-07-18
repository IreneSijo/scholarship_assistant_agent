from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Application, Document, Profile
from services.document_service import VALID_DOCUMENT_TYPES
from services.eligibility_service import get_eligible_scholarships

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

PROFILE_FIELDS = [
    "name", "email", "phone", "college", "course", "year",
    "cgpa", "gender", "category", "annual_income", "state",
]


@router.get("")
def dashboard_summary(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile first")

    filled = sum(1 for f in PROFILE_FIELDS if getattr(profile, f) not in (None, ""))
    completion_pct = round((filled / len(PROFILE_FIELDS)) * 100)

    documents = db.query(Document).filter(Document.profile_id == profile.id).all()
    uploaded_types = {d.document_type for d in documents}
    missing_types = sorted(VALID_DOCUMENT_TYPES - uploaded_types)

    applications = db.query(Application).filter(Application.profile_id == profile.id).all()
    eligible = get_eligible_scholarships(profile)

    return {
        "profile_completion_pct": completion_pct,
        "documents_uploaded": len(documents),
        "documents_total_types": len(VALID_DOCUMENT_TYPES),
        "missing_document_types": missing_types,
        "eligible_scholarships_count": len(eligible),
        "applications_total": len(applications),
        "applications_pending": sum(1 for a in applications if a.status in ("pending", "awaiting_documents")),
        "applications_submitted": sum(1 for a in applications if a.status == "submitted"),
        "applications_awaiting_documents": [
            {"id": a.id, "scholarship_name": a.scholarship_name, "missing_documents": a.missing_documents}
            for a in applications
            if a.status == "awaiting_documents"
        ],
    }
