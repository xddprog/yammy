from fastapi import APIRouter, Depends

from app.api.v1.dependency.providers.request import get_current_user
from app.api.v1.routers.admin.filter import router as filter_router
from app.api.v1.routers.admin.auth import router as auth_router


api_v1_routers = APIRouter(prefix="/admin")
PROTECTED = Depends(get_current_user)


api_v1_routers.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_routers.include_router(filter_router, prefix="/filters", tags=["filters"])

