"""SQLAlchemy ORM models."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db import Base


class Profile(Base):
    """A single-user proof-of-concept: we keep one profile row (id=1)."""

    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    college: Mapped[str] = mapped_column(String(200))
    course: Mapped[str] = mapped_column(String(120))
    year: Mapped[int] = mapped_column(Integer)
    cgpa: Mapped[float] = mapped_column(Float)
    gender: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(50))
    annual_income: Mapped[float] = mapped_column(Float)
    state: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"))
    document_type: Mapped[str] = mapped_column(String(80))  # e.g. "aadhaar", "income_certificate"
    filename: Mapped[str] = mapped_column(String(255))
    filepath: Mapped[str] = mapped_column(String(500))
    upload_date: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    profile: Mapped["Profile"] = relationship(back_populates="documents")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"))
    scholarship_id: Mapped[str] = mapped_column(String(50))
    scholarship_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), default="pending")
    # pending | awaiting_documents | submitted | failed
    missing_documents: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    thread_id: Mapped[str] = mapped_column(String(80), default="")  # LangGraph checkpoint thread id
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow
    )

    profile: Mapped["Profile"] = relationship(back_populates="applications")


class DemoSubmission(Base):
    """
    Represents a row in the DEMO SCHOLARSHIP PORTAL's own database - i.e. the
    external website Playwright automates. Kept separate from Application
    (which is *our* record of what the agent attempted) to accurately model
    two independent systems talking to each other, the way a real scholarship
    site would.
    """

    __tablename__ = "demo_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scholarship_id: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    college: Mapped[str] = mapped_column(String(200))
    course: Mapped[str] = mapped_column(String(120))
    cgpa: Mapped[float] = mapped_column(Float)
    income: Mapped[float] = mapped_column(Float)
    gender: Mapped[str] = mapped_column(String(30))
    state: Mapped[str] = mapped_column(String(80))
    uploaded_files: Mapped[str] = mapped_column(Text, default="")  # comma-separated doc types received
    submitted_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
