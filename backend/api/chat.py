from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Profile
from models.schemas import ChatRequest, ChatResponse
from services.chat_service import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile first")
    reply = answer_question(db, profile, payload.message)
    return ChatResponse(reply=reply)
