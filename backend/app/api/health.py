from fastapi import APIRouter
from app.core.config import settings
from app.db.connection import check_db_connection

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health and readiness check")
def get_health():
    """
    Returns application and database readiness.
    Conforms to docs/integration-contract.md section 3.2.
    """
    is_db_connected = check_db_connection()
    db_status = "connected" if is_db_connected else "disconnected"
    overall_status = "healthy" if is_db_connected else "degraded"

    return {
        "status": overall_status,
        "app": "ocutrack-backend",
        "version": settings.APP_VERSION,
        "database": db_status,
    }
