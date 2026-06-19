from app.api.v1.routers.admin.filter import router as filter_router
from app.api.v1.routers.admin.auth import router as auth_router
from app.api.v1.routers.admin.stats import router as stats_router
from app.api.v1.routers.admin.moderation import router as moderation_router
from app.api.v1.routers.admin.users import router as users_router
from app.api.v1.routers.admin.reports import router as reports_router
from fastapi import APIRouter


api_v1_routers = APIRouter(prefix="/admin")

api_v1_routers.include_router(auth_router, prefix="/auth", tags=["admin-auth"])
api_v1_routers.include_router(filter_router, prefix="/filters", tags=["admin-filters"])
api_v1_routers.include_router(stats_router, prefix="/stats", tags=["admin-stats"])
api_v1_routers.include_router(moderation_router, prefix="/moderation", tags=["admin-moderation"])
api_v1_routers.include_router(users_router, prefix="/users", tags=["admin-users"])
api_v1_routers.include_router(reports_router, prefix="/reports", tags=["admin-reports"])
