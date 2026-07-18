"""
Document storage and matching logic.

Document matching deliberately does NOT rely on filenames. Every uploaded
document is tagged with a `document_type` at upload time (chosen by the
user from a fixed list), and that metadata field is what the agent uses to
resolve "which file satisfies this required upload field".
"""
from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from models.models import Document
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

VALID_DOCUMENT_TYPES = {
    "aadhaar",
    "passport_photo",
    "income_certificate",
    "marksheet",
    "bonafide_certificate",
    "community_certificate",
}


def save_document(db: Session, profile_id: int, document_type: str, upload: UploadFile) -> Document:
    if document_type not in VALID_DOCUMENT_TYPES:
        raise ValueError(f"Unknown document_type '{document_type}'")

    storage_dir = Path(settings.document_storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)

    safe_suffix = Path(upload.filename or "file").suffix
    unique_name = f"{document_type}_{uuid.uuid4().hex[:8]}{safe_suffix}"
    dest_path = storage_dir / unique_name

    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)

    # Replace any previous document of the same type for this profile
    existing = (
        db.query(Document)
        .filter(Document.profile_id == profile_id, Document.document_type == document_type)
        .first()
    )
    if existing:
        db.delete(existing)
        db.flush()

    doc = Document(
        profile_id=profile_id,
        document_type=document_type,
        filename=upload.filename or unique_name,
        filepath=str(dest_path),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    logger.info("Saved document type=%s for profile=%s -> %s", document_type, profile_id, dest_path)
    return doc


def match_documents_to_requirements(
    db: Session, profile_id: int, required_documents: list[str]
) -> tuple[dict[str, str], list[str]]:
    """
    Resolves required_documents (e.g. ["aadhaar", "income_certificate"]) against
    the profile's stored documents using the document_type metadata field.

    Returns (matched: {doc_type: filepath}, missing: [doc_type, ...])
    """
    docs = db.query(Document).filter(Document.profile_id == profile_id).all()
    by_type = {d.document_type: d.filepath for d in docs}

    matched: dict[str, str] = {}
    missing: list[str] = []
    for req in required_documents:
        if req in by_type:
            matched[req] = by_type[req]
        else:
            missing.append(req)

    return matched, missing
