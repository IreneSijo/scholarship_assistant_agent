"""Business logic for matching a user profile against the scholarship dataset."""
from __future__ import annotations

from models.models import Profile
from models.schemas import EligibleScholarship, Scholarship
from services.dataset_service import load_scholarships


def _is_eligible(profile: Profile, scholarship: Scholarship) -> tuple[bool, list[str]]:
    """Returns (eligible, reasons). Reasons explain the match or the failure."""
    reasons: list[str] = []
    eligible = True

    if profile.cgpa < scholarship.minimum_cgpa:
        eligible = False
        reasons.append(f"CGPA {profile.cgpa} is below required minimum {scholarship.minimum_cgpa}")
    else:
        reasons.append(f"CGPA {profile.cgpa} meets minimum {scholarship.minimum_cgpa}")

    if profile.annual_income > scholarship.maximum_income:
        eligible = False
        reasons.append(
            f"Family income {profile.annual_income:.0f} exceeds max allowed {scholarship.maximum_income:.0f}"
        )
    else:
        reasons.append(f"Family income within allowed limit of {scholarship.maximum_income:.0f}")

    if "All" not in scholarship.eligible_gender and profile.gender not in scholarship.eligible_gender:
        eligible = False
        reasons.append(f"Gender '{profile.gender}' not eligible (allowed: {', '.join(scholarship.eligible_gender)})")

    if "All" not in scholarship.eligible_state and profile.state not in scholarship.eligible_state:
        eligible = False
        reasons.append(f"State '{profile.state}' not eligible (allowed: {', '.join(scholarship.eligible_state)})")

    return eligible, reasons


def get_eligible_scholarships(profile: Profile) -> list[EligibleScholarship]:
    results: list[EligibleScholarship] = []
    for scholarship in load_scholarships():
        eligible, reasons = _is_eligible(profile, scholarship)
        if eligible:
            results.append(EligibleScholarship(**scholarship.model_dump(), reasons=reasons))
    return results


def explain_ineligibility(profile: Profile, scholarship_id: str) -> list[str]:
    """Used by the chat assistant to explain why a specific scholarship was rejected."""
    from services.dataset_service import get_scholarship_by_id

    scholarship = get_scholarship_by_id(scholarship_id)
    if not scholarship:
        return ["Scholarship not found."]
    _, reasons = _is_eligible(profile, scholarship)
    return reasons
