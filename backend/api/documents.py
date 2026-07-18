from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Document, Profile
from models.schemas import DocumentOut
from services.document_service import VALID_DOCUMENT_TYPES, save_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        return []
    return db.query(Document).filter(Document.profile_id == profile.id).all()


@router.post("", response_model=DocumentOut)
def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile before uploading documents")
    if document_type not in VALID_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"document_type must be one of {sorted(VALID_DOCUMENT_TYPES)}")
    try:
        doc = save_document(db, profile.id, document_type, file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Document not found")
    document = db.query(Document).filter(Document.id == document_id, Document.profile_id == profile.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    from services.document_service import delete_document_file

    delete_document_file(document.filepath)
    db.delete(document)
    db.commit()
