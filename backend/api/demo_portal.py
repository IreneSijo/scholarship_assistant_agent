"""
Endpoint for the DEMO scholarship portal (frontend/src/pages/DemoPortalPage.jsx).

This simulates an external scholarship website's own backend: it just
receives the submitted form + files and stores them, with no knowledge of
our agent, our Profile, or our Application table.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import DemoSubmission
from services.dataset_service import get_scholarship_by_id
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/demo-portal", tags=["demo-portal"])


@router.post("/submit")
def submit_demo_application(
    scholarship_id: str = Form(""),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    college: str = Form(...),
    course: str = Form(...),
    cgpa: float = Form(...),
    income: float = Form(...),
    gender: str = Form(...),
    state: str = Form(...),
    aadhaar_file: UploadFile | None = File(None),
    income_certificate_file: UploadFile | None = File(None),
    marksheet_file: UploadFile | None = File(None),
    bonafide_certificate_file: UploadFile | None = File(None),
    passport_photo_file: UploadFile | None = File(None),
    community_certificate_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    required_values = {
        "name": name, "email": email, "phone": phone, "college": college, "course": course,
        "gender": gender, "state": state,
    }
    missing_values = [field for field, value in required_values.items() if not str(value).strip()]
    if missing_values:
        raise HTTPException(status_code=422, detail=f"Complete the required fields: {', '.join(missing_values)}")

    files_by_type = {
        "aadhaar": aadhaar_file,
        "income_certificate": income_certificate_file,
        "marksheet": marksheet_file,
        "bonafide_certificate": bonafide_certificate_file,
        "passport_photo": passport_photo_file,
        "community_certificate": community_certificate_file,
    }
    scholarship = get_scholarship_by_id(scholarship_id)
    required_documents = scholarship.required_documents if scholarship else []
    missing_files = [doc_type for doc_type in required_documents if not files_by_type.get(doc_type) or not files_by_type[doc_type].filename]
    if missing_files:
        raise HTTPException(status_code=422, detail=f"Attach the required documents: {', '.join(missing_files)}")

    received_files = []
    for label, f in [
        ("aadhaar", aadhaar_file),
        ("income_certificate", income_certificate_file),
        ("marksheet", marksheet_file),
        ("bonafide_certificate", bonafide_certificate_file),
        ("passport_photo", passport_photo_file),
        ("community_certificate", community_certificate_file),
    ]:
        if f is not None and f.filename:
            received_files.append(label)

    submission = DemoSubmission(
        scholarship_id=scholarship_id,
        name=name,
        email=email,
        phone=phone,
        college=college,
        course=course,
        cgpa=cgpa,
        income=income,
        gender=gender,
        state=state,
        uploaded_files=",".join(received_files),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    logger.info("Demo portal received submission %s for scholarship %s", submission.id, scholarship_id)
    return {"success": True, "submission_id": submission.id}
