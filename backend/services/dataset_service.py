"""Loads and queries the JSON scholarship dataset."""
from __future__ import annotations

import json
from functools import lru_cache

from models.schemas import Scholarship
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def load_scholarships() -> list[Scholarship]:
    with open(settings.dataset_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    logger.info("Loaded %d scholarships from dataset", len(raw))
    return [Scholarship(**item) for item in raw]


def get_scholarship_by_id(scholarship_id: str) -> Scholarship | None:
    for s in load_scholarships():
        if s.id == scholarship_id:
            return s
    return None
