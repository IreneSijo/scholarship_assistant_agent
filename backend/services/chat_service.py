"""
Chat assistant.

Uses the same eligibility/document-matching logic as the LangGraph agent so
answers stay consistent with what the workflow actually decides. If a Gemini
API key is configured, Gemini is used to phrase a natural-language answer
grounded in that data; otherwise a deterministic template is used so the
feature still works without an API key.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from models.models import Document, Profile
from services.dataset_service import load_scholarships
from services.document_service import VALID_DOCUMENT_TYPES, match_documents_to_requirements
from services.eligibility_service import get_eligible_scholarships
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


def _build_context(db: Session, profile: Profile) -> str:
    eligible = get_eligible_scholarships(profile)
    all_scholarships = load_scholarships()
    ineligible = [s for s in all_scholarships if s.id not in {e.id for e in eligible}]

    uploaded_types = {d.document_type for d in db.query(Document).filter(Document.profile_id == profile.id).all()}
    missing_overall = VALID_DOCUMENT_TYPES - uploaded_types

    lines = [
        f"Profile: {profile.name}, CGPA {profile.cgpa}, income {profile.annual_income}, "
        f"gender {profile.gender}, state {profile.state}.",
        f"Uploaded documents: {', '.join(uploaded_types) or 'none'}.",
        f"Missing documents overall: {', '.join(missing_overall) or 'none'}.",
        f"Eligible scholarships ({len(eligible)}): " + "; ".join(s.name for s in eligible) if eligible else "Eligible scholarships: none",
    ]
    for s in ineligible[:6]:
        _, missing_docs = match_documents_to_requirements(db, profile.id, s.required_documents)
        lines.append(f"NOT eligible for {s.name}: cgpa_min={s.minimum_cgpa}, income_max={s.maximum_income}")
    return "\n".join(lines)


def _fallback_answer(message: str, context: str, profile: Profile, db: Session) -> str:
    msg = message.lower()
    eligible = get_eligible_scholarships(profile)

    if "why" in msg and "not eligible" in msg:
        all_scholarships = load_scholarships()
        eligible_ids = {s.id for s in eligible}
        ineligible = [s for s in all_scholarships if s.id not in eligible_ids]
        if not ineligible:
            return "You're currently eligible for every scholarship in the dataset. Nice work!"
        parts = []
        for s in ineligible[:5]:
            reasons = []
            if profile.cgpa < s.minimum_cgpa:
                reasons.append(f"your CGPA ({profile.cgpa}) is below the required {s.minimum_cgpa}")
            if profile.annual_income > s.maximum_income:
                reasons.append(f"your family income exceeds the {s.maximum_income:.0f} limit")
            if "All" not in s.eligible_gender and profile.gender not in s.eligible_gender:
                reasons.append("your gender isn't in the eligible list")
            if "All" not in s.eligible_state and profile.state not in s.eligible_state:
                reasons.append("your state isn't in the eligible list")
            parts.append(f"{s.name}: " + (", ".join(reasons) if reasons else "requirements not fully met"))
        return "Here's why some scholarships aren't a match:\n" + "\n".join(parts)

    if "missing" in msg and "document" in msg:
        uploaded_types = {d.document_type for d in db.query(Document).filter(Document.profile_id == profile.id).all()}
        missing_overall = VALID_DOCUMENT_TYPES - uploaded_types
        if not missing_overall:
            return "You've uploaded every supported document type. You're all set!"
        return "You're still missing: " + ", ".join(sorted(missing_overall))

    if "eligible" in msg:
        if not eligible:
            return "Based on your current profile, you aren't eligible for any scholarship yet. Try asking why!"
        names = ", ".join(s.name for s in eligible)
        return f"You're eligible for {len(eligible)} scholarship(s): {names}."

    return (
        "I can tell you which scholarships you're eligible for, why you might not qualify for one, "
        "or which documents you're still missing. Try asking one of those!"
    )


def answer_question(db: Session, profile: Profile, message: str) -> str:
    context = _build_context(db, profile)

    if not settings.google_api_key:
        return _fallback_answer(message, context, profile, db)

    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_google_genai import ChatGoogleGenerativeAI

        llm = ChatGoogleGenerativeAI(model=settings.gemini_model, google_api_key=settings.google_api_key)
        system = (
            "You are the AI Scholarship Assistant. Answer ONLY using the context provided. "
            "Be concise, friendly, and specific. If information isn't in the context, say so."
        )
        response = llm.invoke(
            [SystemMessage(content=system), HumanMessage(content=f"Context:\n{context}\n\nQuestion: {message}")]
        )
        return response.content
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gemini call failed, using fallback: %s", exc)
        return _fallback_answer(message, context, profile, db)
