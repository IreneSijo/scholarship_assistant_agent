"""
Playwright browser-automation tool.

IMPORTANT: This module is a *tool*, not the agent. It is invoked by the
LangGraph "Application Agent" node once it has decided the application is
ready to submit. It knows nothing about eligibility or decision-making -
it just drives a real Chromium browser to fill and submit the demo portal.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import sync_playwright

from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class ApplicationFormData:
    name: str
    email: str
    phone: str
    college: str
    course: str
    cgpa: float
    income: float
    gender: str
    state: str
    documents: dict[str, dict[str, str]] = field(default_factory=dict)  # doc_type -> {path, filename}


def submit_application(form_data: ApplicationFormData, scholarship_id: str) -> dict:
    """
    Launches a *visible* Chromium browser, opens the demo scholarship portal,
    fills every field and uploads matched documents. The user reviews the
    visible form and submits it themselves.

    Returns a result dict with success flag and any error message.
    """
    document_links = {
        document_type: {
            "filename": document["filename"],
            "stored_filename": Path(document["path"]).name,
            "url": f"http://localhost:8000/files/{Path(document['path']).name}",
        }
        for document_type, document in form_data.documents.items()
    }
    portal_url = f"{settings.demo_portal_url}?{urlencode({
        'scholarship_id': scholarship_id,
        'required_documents': ','.join(form_data.documents),
        'document_links': json.dumps(document_links),
    })}"
    logger.info("Launching Playwright against %s", portal_url)

    result = {"success": False, "message": ""}

    with sync_playwright() as p:
        browser = None
        try:
            browser = p.chromium.launch(headless=False, slow_mo=250)
            page = browser.new_page()
            page.goto(portal_url, wait_until="load", timeout=15000)

            page.fill('input[name="name"]', form_data.name)
            page.fill('input[name="email"]', form_data.email)
            page.fill('input[name="phone"]', form_data.phone)
            page.fill('input[name="college"]', form_data.college)
            page.fill('input[name="course"]', form_data.course)
            page.fill('input[name="cgpa"]', str(form_data.cgpa))
            page.fill('input[name="income"]', str(form_data.income))
            page.select_option('select[name="gender"]', form_data.gender)
            page.fill('input[name="state"]', form_data.state)

            upload_field_map = {
                "aadhaar": 'input[name="aadhaar_file"]',
                "income_certificate": 'input[name="income_certificate_file"]',
                "marksheet": 'input[name="marksheet_file"]',
                "bonafide_certificate": 'input[name="bonafide_certificate_file"]',
                "passport_photo": 'input[name="passport_photo_file"]',
                "community_certificate": 'input[name="community_certificate_file"]',
            }
            for doc_type, document in form_data.documents.items():
                selector = upload_field_map.get(doc_type)
                if selector:
                    try:
                        page.set_input_files(selector, document["path"])
                    except Exception as exc:  # noqa: BLE001
                        logger.warning("Could not upload %s: %s", doc_type, exc)

            logger.info("Form is ready for user review; waiting for submission")
            page.wait_for_selector("text=Application received. Thank you for applying.", timeout=0)

            result["success"] = True
            result["message"] = "Application reviewed and submitted."
        except Exception as exc:  # noqa: BLE001
            logger.exception("Playwright automation failed")
            result["message"] = f"Automation failed: {exc}"
        finally:
            if browser is not None:
                browser.close()

    return result
