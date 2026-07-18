"""
Endpoint for the DEMO scholarship portal (frontend/src/pages/DemoPortalPage.jsx).

This simulates an external scholarship website's own backend: it just
receives the submitted form + files and stores them, with no knowledge of
our agent, our Profile, or our Application table.
"""
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import DemoSubmission
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
    db: Session = Depends(get_db),
):
    received_files = []
    for label, f in [
        ("aadhaar", aadhaar_file),
        ("income_certificate", income_certificate_file),
        ("marksheet", marksheet_file),
        ("bonafide_certificate", bonafide_certificate_file),
        ("passport_photo", passport_photo_file),
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
