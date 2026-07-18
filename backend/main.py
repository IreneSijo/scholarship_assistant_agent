"""
AI Scholarship Assistant - FastAPI entrypoint.

Run with:
    uvicorn main:app --reload --port 8000
(from inside the backend/ directory)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api import applications, chat, dashboard, demo_portal, documents, profile, scholarships
from database.db import init_db
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="AI Scholarship Assistant API",
    description="Agentic backend that automates scholarship discovery and application filing.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    logger.info("Initializing database...")
    init_db()
    logger.info("Startup complete.")


app.include_router(profile.router)
app.include_router(documents.router)
app.include_router(scholarships.router)
app.include_router(applications.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(demo_portal.router)

# Serve uploaded documents (useful for previewing in the Document Vault UI)
app.mount("/files", StaticFiles(directory=settings.document_storage_path), name="files")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Scholarship Assistant"}
