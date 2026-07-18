"""Pydantic schemas used for request validation and API responses."""
from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    college: str
    course: str
    year: int = Field(ge=1, le=6)
    cgpa: float = Field(ge=0, le=10)
    gender: str
    category: str
    annual_income: float = Field(ge=0)
    state: str


class ProfileOut(ProfileIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt.datetime
    updated_at: dt.datetime


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_type: str
    filename: str
    filepath: str
    upload_date: dt.datetime


class Scholarship(BaseModel):
    id: str
    name: str
    description: str
    minimum_cgpa: float
    maximum_income: float
    eligible_gender: list[str]
    eligible_state: list[str]
    required_documents: list[str]
    deadline: str


class EligibleScholarship(Scholarship):
    reasons: list[str] = []


class ApplyRequest(BaseModel):
    scholarship_id: str


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scholarship_id: str
    scholarship_name: str
    status: str
    missing_documents: str
    thread_id: str
    created_at: dt.datetime
    updated_at: dt.datetime


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


class ResumeRequest(BaseModel):
    application_id: int
