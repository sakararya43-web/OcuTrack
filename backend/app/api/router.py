from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.patients import router as patients_router
from app.api.assessments import router as assessments_router

api_router = APIRouter()

# Register routes under /api
api_router.include_router(health_router)
api_router.include_router(patients_router)
api_router.include_router(assessments_router)

