# OcuTrack Backend Service

FastAPI REST API, Supabase / PostgreSQL persistence, upload validation, longitudinal comparison engine, and analysis orchestration service for OcuTrack.

## Architecture

- **Framework:** FastAPI with Python 3.12
- **Persistence:** Supabase PostgreSQL / SQLAlchemy (with local SQLite fallback for testing and offline development)
- **Validation:** Pydantic v2 schemas adhering to `docs/integration-contract.md`
- **CV / Media:** OpenCV for decodability, duration, and frame integrity verification
- **Testing:** Pytest + HTTPX
- **Deployment:** Render (`render.yaml`)

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

| Variable | Description | Default |
|---|---|---|
| `APP_ENV` | Environment name (`development`, `production`, `test`) | `development` |
| `FRONTEND_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `DATABASE_URL` | PostgreSQL connection string (or SQLite URL) | `sqlite:///./ocutrack.db` |
| `SUPABASE_URL` | Supabase project URL | *(optional)* |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only Supabase secret key | *(optional)* |
| `MAX_UPLOAD_MB` | Maximum video file upload limit in MB | `50` |
| `MAX_VIDEO_SECONDS` | Maximum allowed video duration | `30` |
| `TEMP_UPLOAD_DIR` | Private temporary folder for video processing | `./tmp/ocutrack` |

### 3. Database Setup & Migrations

#### Option A: Supabase / PostgreSQL (Production & Staging)

1. Open your Supabase SQL Editor.
2. Execute `database/schema.sql` to apply the complete schema, tables, and indexes.
3. Execute `database/rls_policies.sql` to apply Row Level Security policies.
4. *(Optional demo data)* Execute `database/seed_demo.sql` to load synthetic benchmark profiles.

#### Option B: Local SQLite Fallback (Offline & Hackathon Demo)

If external Supabase network access is unavailable, leaving `DATABASE_URL` as default (`sqlite:///./ocutrack.db`) automatically initializes all tables locally on application startup without requiring external cloud access.

### 4. Run Development Server

From the `backend` directory:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/api/health`

### 5. Automated Tests

From the `backend` directory:

```bash
pytest -v
```

All 43+ unit and integration tests cover health, patient lifecycle, video validation, temporary cleanup, analysis orchestration, security isolation, and longitudinal comparisons.

## Deployment to Render

The service includes `render.yaml` for zero-configuration blueprint deployment:

1. Connect the GitHub repository in your [Render Dashboard](https://dashboard.render.com).
2. Select **New Blueprint Instance** and point to `render.yaml`.
3. In the environment configuration:
   - Set `DATABASE_URL` to your Supabase PostgreSQL connection string.
   - Set `FRONTEND_ORIGINS` to include your deployed Vercel frontend URL (e.g. `https://ocutrack.vercel.app`).
4. Click **Apply**. Render will build and start the service with automatic health checks against `/api/health`.

## Security & Non-Diagnostic Guardrails

- **Pseudonymous Identifiers:** No direct identifiable personal data (names, national IDs, emails) is stored.
- **Temporary Upload Deletion:** Uploaded video files are saved to server-generated private UUID paths and deleted by default in a guaranteed `finally` block upon analysis completion or failure.
- **Non-Diagnostic Policy:** The backend never outputs disease diagnoses or unsupported clinical urgency. All results provide quantitative feature support with standard non-diagnostic disclaimers.
