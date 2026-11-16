# OcuTrack Backend Service

FastAPI REST API, Supabase / PostgreSQL persistence, and analysis orchestration service for OcuTrack.

## Architecture

- **Framework:** FastAPI with Python 3.12
- **Persistence:** Supabase PostgreSQL / SQLAlchemy (with local SQLite fallback for testing and development)
- **Validation:** Pydantic v2 schemas adhering to `docs/integration-contract.md`
- **Testing:** Pytest + HTTPX

## Getting Started

### 1. Environment Setup

Create and activate the virtual environment:

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL / Supabase connection string if available, or leave default for local SQLite storage (`sqlite:///./ocutrack.db`).

### 3. Run the Development Server

From the `backend` directory:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API documentation is available at `http://localhost:8000/docs`.

### 4. Run Automated Tests

From the `backend` directory:

```bash
pytest
```
