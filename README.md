# AI Scholarship Assistant

An agentic AI system that removes the repetitive work from scholarship applications: it
matches a student's profile against a scholarship dataset, reasons about which
documents are missing, and — once everything is ready — drives a real browser
(via Playwright) to fill out and submit the application on their behalf.

This is a **college proof-of-concept**. It does not touch real scholarship
websites; instead it ships with a demo scholarship portal that the agent
automates, so the whole pipeline can be demonstrated end-to-end offline.

---

## 1. Project overview

| Concern | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + React Router |
| Backend | FastAPI (Python) |
| AI agent | LangGraph + LangChain + Google Gemini (model name is configurable) |
| Browser automation | Playwright (Python, sync API) |
| Database | SQLite via SQLAlchemy ORM |
| Document storage | Local filesystem (`backend/storage/documents`) |
| Scholarship data | Static JSON dataset (`backend/datasets/scholarships.json`) |

**The core idea to keep in mind while reading the code:** LangGraph + Gemini
*is* the agent — it loads data, checks eligibility, decides what to do next,
pauses when it needs something from the user, and resumes later. Playwright
is just one tool that agent calls, the same way it could call a database
query or an API. The agent never lives inside the Playwright module, and
Playwright never makes decisions.

---

## 2. Architecture

```
                         ┌─────────────────────┐
                         │   React Frontend     │
                         │ (dashboard + demo    │
                         │  scholarship portal) │
                         └──────────┬───────────┘
                                    │ REST (fetch)
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend    │
                         │  api/*.py routers    │
                         └──────────┬───────────┘
                     ┌──────────────┼───────────────┐
                     ▼              ▼               ▼
             services/*.py   ai_agent/workflow.py  database/db.py
          (eligibility, doc      (LangGraph)          (SQLite via
           matching, chat)           │                 SQLAlchemy)
                                      ▼
                          browser_automation/automation.py
                                 (Playwright tool)
                                      │
                                      ▼
                         Demo Scholarship Portal (React page,
                         served by the SAME frontend, acting as
                         a stand-in for a real external website)
```

### The LangGraph workflow

```
START
  → load_profile
  → load_dataset
  → application_agent   (matches uploaded documents to required documents)
  → documents complete? ──NO──→ notify_missing → [workflow pauses here]
        │                                                │
       YES                                    user uploads missing doc
        │                                                │
        ▼                                     POST /applications/{id}/resume
  playwright_submit                                      │
        │                                                ▼
        ▼                                     re-enters application_agent,
  update_status                                routes to playwright_submit
        │                                       once nothing is missing
        ▼
       END
```

The graph is compiled with `interrupt_after=["notify_missing"]` and a
SQLite-backed checkpointer (`backend/database/agent_checkpoints.db`), so a
paused application genuinely survives a backend restart — resuming re-invokes
the graph under the same `thread_id` instead of starting over.

---

## 3. Folder structure

```
ai-scholarship-assistant/
├── backend/
│   ├── api/                 REST routers (profile, documents, scholarships,
│   │                        applications, chat, dashboard, demo_portal)
│   ├── ai_agent/            LangGraph workflow definition (the AI agent)
│   ├── browser_automation/  Playwright tool (NOT the agent)
│   ├── database/            SQLAlchemy engine/session + SQLite files
│   ├── datasets/            scholarships.json (12 demo scholarships)
│   ├── models/              SQLAlchemy ORM models + Pydantic schemas
│   ├── services/            business logic: eligibility, document matching,
│   │                        dataset loading, chat assistant
│   ├── storage/documents/   uploaded files land here
│   ├── utils/                config (env vars) + logging
│   ├── main.py               FastAPI app entrypoint
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js     fetch wrapper for every backend endpoint
    │   ├── components/       Shell (sidebar), shared UI primitives
    │   └── pages/            Dashboard, Profile, Documents, Scholarships,
    │                         Applications, Chat, DemoPortal
    ├── index.html
    └── package.json
```

> **Note on naming:** the brief's folder names `backend/playwright` and
> `backend/langgraph` were renamed to `backend/browser_automation` and
> `backend/ai_agent` respectively. Python resolves local packages before
> installed ones, so a local folder literally named `playwright` or
> `langgraph` shadows the real libraries those modules import — this was
> caught in testing and fixed so `import playwright` / `import langgraph`
> resolve correctly.

---

## 4. Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key (optional — see below)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium     # downloads the browser binary Playwright drives

cp .env.example .env
# edit .env and add your GOOGLE_API_KEY (optional, see note below)
```

### Frontend

```bash
cd frontend
npm install
```

---

## 5. Running the project

Run these in three separate terminals, from the project root:

```bash
# 1. Backend API
cd backend
uvicorn main:app --reload --port 8000

# 2. Frontend (dashboard + demo portal)
cd frontend
npm run dev
# open http://localhost:5173
```

That's it — there's no separate step to "run Playwright". The browser
launches automatically, *visibly*, whenever the agent reaches the
`playwright_submit` node (i.e. when you click **Apply with AI agent** on an
eligible scholarship and all required documents are present).

### Suggested demo flow
1. Fill out **Profile**.
2. Upload a few documents in **Document Vault** — deliberately skip one.
3. Go to **Find Scholarships** and click **Apply with AI agent** on an
   eligible scholarship that needs the document you skipped.
4. Watch the application land in **Applications** as `awaiting_documents`,
   with the missing document named.
5. Go back to **Document Vault**, upload the missing document.
6. Return to **Applications** and click **Resume workflow** — a Chromium
   window opens, the demo portal is filled and submitted automatically, and
   the status flips to `submitted`.
7. Try **Ask the Assistant** with "Why am I not eligible for some
   scholarships?" or "Which documents are missing?".

### About the Gemini API key
`GOOGLE_API_KEY` is optional. Without it, the agent still runs the full
LangGraph workflow (eligibility, document matching, pause/resume, Playwright
submission) using deterministic logic, and the chat assistant answers using a
template instead of an LLM. Add a key to `.env` to have Gemini phrase the
chat responses naturally.

---

## 6. Backend API reference

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/profile` | Read / create-or-update the applicant profile |
| GET/POST | `/documents` | List documents / upload a document (`document_type` + `file`) |
| GET | `/scholarships` | Full scholarship dataset |
| GET | `/eligible-scholarships` | Scholarships the current profile qualifies for |
| POST | `/apply` | Start the LangGraph agent for one scholarship |
| GET | `/applications` | List filed applications and their status |
| POST | `/applications/{id}/resume` | Resume a paused (awaiting-documents) application |
| POST | `/chat` | Ask the chat assistant a question |
| GET | `/dashboard` | Aggregated dashboard stats |
| POST | `/demo-portal/submit` | Receives submissions from the demo portal (simulates the external site's own backend) |

---

## 7. Screenshots

_Add screenshots of the Dashboard, Document Vault, Scholarship Finder, and a
Playwright run in progress here before presenting._

---

## 8. Future improvements

- Multi-user auth (the current proof-of-concept keeps a single profile, id=1)
- Persist LangGraph checkpoints per-application instead of one shared SQLite file
- Extend the chat assistant into a full LangGraph tool-calling agent, so it can
  trigger applications and uploads directly from the conversation
- OCR-based auto-verification of uploaded documents
- Replace the demo portal with adapters for real scholarship websites,
  reusing the same agent graph with different Playwright selectors per site
- Notification emails/SMS when an application is paused or submitted
