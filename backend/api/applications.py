import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from ai_agent.workflow import resume_workflow, run_workflow
from models.models import Application, Profile
from models.schemas import ApplicationOut, ApplyRequest
from services.dataset_service import get_scholarship_by_id
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["applications"])


@router.get("/applications", response_model=list[ApplicationOut])
def list_applications(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        return []
    return db.query(Application).filter(Application.profile_id == profile.id).order_by(Application.id.desc()).all()


@router.post("/apply", response_model=ApplicationOut)
def apply_to_scholarship(payload: ApplyRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile first")

    scholarship = get_scholarship_by_id(payload.scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    existing_application = (
        db.query(Application)
        .filter(Application.profile_id == profile.id, Application.scholarship_id == scholarship.id)
        .first()
    )
    if existing_application:
        raise HTTPException(status_code=409, detail="You have already applied for this scholarship")

    thread_id = str(uuid.uuid4())
    application = Application(
        profile_id=profile.id,
        scholarship_id=scholarship.id,
        scholarship_name=scholarship.name,
        status="pending",
        thread_id=thread_id,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    logger.info("Starting LangGraph agent for application %s (%s)", application.id, scholarship.name)
    try:
        run_workflow(db, profile.id, scholarship.id, application.id, thread_id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Agent workflow failed")
        application.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Agent workflow failed: {exc}") from exc

    db.refresh(application)
    return application


@router.post("/applications/{application_id}/resume", response_model=ApplicationOut)
def resume_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="No profile found")

    logger.info("Resuming LangGraph agent for application %s", application.id)
    try:
        resume_workflow(db, application.thread_id, profile.id, application.scholarship_id, application.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Resume failed")
        raise HTTPException(status_code=500, detail=f"Resume failed: {exc}") from exc

    db.refresh(application)
    return application
