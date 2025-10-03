from fastapi import APIRouter

from app.api.v1.endpoints import auth, admin, student, voice

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(student.router, prefix="/student", tags=["student"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])