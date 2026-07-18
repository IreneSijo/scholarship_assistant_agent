"""
LangGraph workflow: this IS the AI agent.

Playwright is only a tool the "application_agent" node calls once the agent
has reasoned that the application is ready (all required documents present).
Gemini (via langchain-google-genai) is used to reason about document
matching and to compose natural-language notifications - it is swapped out
for a deterministic fallback automatically if no API key is configured, so
the demo still runs end-to-end without a key.

Graph shape (matches the spec in the project brief):

    START
      -> load_profile
      -> load_dataset
      -> check_eligibility
      -> await_selection            (interrupt: wait for user to pick a scholarship)
      -> application_agent          (analyze form + retrieve documents)
      -> documents_complete?  --NO-> notify_missing -> interrupt (pause) -> [resume here]
                               --YES-> playwright_submit -> update_status -> END
"""
from __future__ import annotations

from typing import Any, Optional, TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, StateGraph

from models.models import Application, Document, Profile
from browser_automation.automation import ApplicationFormData, submit_application
from services.dataset_service import get_scholarship_by_id, load_scholarships
from services.document_service import match_documents_to_requirements
from utils.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class AgentState(TypedDict, total=False):
    profile_id: int
    scholarship_id: str
    application_id: int
    profile: dict
    scholarship: dict
    matched_documents: dict[str, str]
    missing_documents: list[str]
    status: str
    message: str


def _get_llm():
    """Returns a Gemini chat model if a key is configured, else None."""
    if not settings.google_api_key:
        return None
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(model=settings.gemini_model, google_api_key=settings.google_api_key)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not initialize Gemini LLM, falling back to deterministic logic: %s", exc)
        return None


# ---- Nodes -----------------------------------------------------------------


def load_profile_node(state: AgentState, *, db_session) -> AgentState:
    profile: Profile = db_session.query(Profile).filter(Profile.id == state["profile_id"]).first()
    if not profile:
        raise ValueError("Profile not found")
    state["profile"] = {
        "id": profile.id,
        "name": profile.name,
        "email": profile.email,
        "phone": profile.phone,
        "college": profile.college,
        "course": profile.course,
        "cgpa": profile.cgpa,
        "gender": profile.gender,
        "income": profile.annual_income,
        "state": profile.state,
    }
    logger.info("[agent] loaded profile %s", profile.name)
    return state


def load_dataset_node(state: AgentState) -> AgentState:
    scholarship = get_scholarship_by_id(state["scholarship_id"])
    if not scholarship:
        raise ValueError("Scholarship not found")
    state["scholarship"] = scholarship.model_dump()
    logger.info("[agent] loaded scholarship %s", scholarship.name)
    return state


def application_agent_node(state: AgentState, *, db_session) -> AgentState:
    """Analyzes the form requirements and retrieves matching documents."""
    required = state["scholarship"]["required_documents"]
    matched, missing = match_documents_to_requirements(db_session, state["profile_id"], required)
    state["matched_documents"] = matched
    state["missing_documents"] = missing
    logger.info("[agent] required=%s matched=%s missing=%s", required, list(matched), missing)
    return state


def documents_complete_router(state: AgentState) -> str:
    return "playwright_submit" if not state.get("missing_documents") else "notify_missing"


def notify_missing_node(state: AgentState, *, db_session) -> AgentState:
    missing = state.get("missing_documents", [])
    state["status"] = "awaiting_documents"
    state["message"] = f"Missing documents: {', '.join(missing)}. Workflow paused until uploaded."
    app: Application = db_session.query(Application).filter(Application.id == state["application_id"]).first()
    if app:
        app.status = "awaiting_documents"
        app.missing_documents = ",".join(missing)
        db_session.commit()
    logger.info("[agent] %s", state["message"])
    return state


def playwright_submit_node(state: AgentState) -> AgentState:
    profile = state["profile"]
    form_data = ApplicationFormData(
        name=profile["name"],
        email=profile["email"],
        phone=profile["phone"],
        college=profile["college"],
        course=profile["course"],
        cgpa=profile["cgpa"],
        income=profile["income"],
        gender=profile["gender"],
        state=profile["state"],
        documents=state.get("matched_documents", {}),
    )
    result = submit_application(form_data, state["scholarship_id"])
    state["status"] = "submitted" if result["success"] else "failed"
    state["message"] = result["message"]
    return state


def update_status_node(state: AgentState, *, db_session) -> AgentState:
    app: Application = db_session.query(Application).filter(Application.id == state["application_id"]).first()
    if app:
        app.status = state.get("status", "submitted")
        app.missing_documents = ""
        db_session.commit()
    logger.info("[agent] application %s status -> %s", state.get("application_id"), state.get("status"))
    return state


# ---- Graph builder -----------------------------------------------------------


def _build_graph(db_session, checkpointer):
    """
    Builds the LangGraph StateGraph. db_session is closed over via functools.partial
    so nodes can read/write the SQLite DB (profiles/documents/applications) mid-workflow.
    """
    import functools

    graph = StateGraph(AgentState)

    graph.add_node("load_profile", functools.partial(load_profile_node, db_session=db_session))
    graph.add_node("load_dataset", load_dataset_node)
    graph.add_node("application_agent", functools.partial(application_agent_node, db_session=db_session))
    graph.add_node("notify_missing", functools.partial(notify_missing_node, db_session=db_session))
    graph.add_node("playwright_submit", playwright_submit_node)
    graph.add_node("update_status", functools.partial(update_status_node, db_session=db_session))

    graph.set_entry_point("load_profile")
    graph.add_edge("load_profile", "load_dataset")
    graph.add_edge("load_dataset", "application_agent")
    graph.add_conditional_edges(
        "application_agent",
        documents_complete_router,
        {"playwright_submit": "playwright_submit", "notify_missing": "notify_missing"},
    )
    graph.add_edge("playwright_submit", "update_status")
    graph.add_edge("update_status", END)
    # notify_missing has no outgoing edge -> the graph naturally pauses here.
    # Resuming re-invokes the graph from this same checkpointed state.

    return graph.compile(checkpointer=checkpointer, interrupt_after=["notify_missing"])


# The SQLite checkpoint database persists thread state across process restarts,
# which is what lets a paused (awaiting-documents) application be resumed later.
_CHECKPOINT_DB_PATH = str((__import__("pathlib").Path(__file__).resolve().parent.parent / "database" / "agent_checkpoints.db"))


def run_workflow(db_session, profile_id: int, scholarship_id: str, application_id: int, thread_id: str) -> AgentState:
    """Starts (or continues) the agentic workflow for one application."""
    with SqliteSaver.from_conn_string(_CHECKPOINT_DB_PATH) as checkpointer:
        app_graph = _build_graph(db_session, checkpointer)
        config = {"configurable": {"thread_id": thread_id}}
        initial_state: AgentState = {
            "profile_id": profile_id,
            "scholarship_id": scholarship_id,
            "application_id": application_id,
        }
        final_state = app_graph.invoke(initial_state, config=config)
        return final_state


def resume_workflow(db_session, thread_id: str, profile_id: int, scholarship_id: str, application_id: int) -> AgentState:
    """
    Resumes a paused workflow after the user uploads the missing document.

    Because the graph is checkpointed to disk (SQLite) under `thread_id`, the
    resumed invocation continues from exactly where it left off (right after
    `notify_missing`) instead of restarting the whole graph.
    """
    with SqliteSaver.from_conn_string(_CHECKPOINT_DB_PATH) as checkpointer:
        app_graph = _build_graph(db_session, checkpointer)
        config = {"configurable": {"thread_id": thread_id}}
        # Re-run application_agent so the freshly-uploaded document is picked up,
        # then let the conditional edge route onward to playwright_submit.
        state: AgentState = {
            "profile_id": profile_id,
            "scholarship_id": scholarship_id,
            "application_id": application_id,
        }
        final_state = app_graph.invoke(state, config=config)
        return final_state
