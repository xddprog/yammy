from fastapi import APIRouter, Depends

from app.api.v1.dependency.providers.request import get_current_user

from app.api.v1.routers.client.auth import router as auth_router
from app.api.v1.routers.client.users import router as users_router
from app.api.v1.routers.client.like import router as like_router
from app.api.v1.routers.client.appearance_rating import router as appearance_rating_router
from app.api.v1.routers.client.chat import router as chat_router
from app.api.v1.routers.client.presence import router as presence_router
from app.api.v1.routers.client.report import router as report_router
from app.api.v1.routers.client.universities import router as universities_router
from app.api.v1.routers.client.cities import router as cities_router
from app.api.v1.routers.client.filters import router as filters_router
from app.api.v1.routers.client.tarot import router as tarot_router
from app.api.v1.routers.client.telegram import router as telegram_router


api_v1_routers = APIRouter(prefix="/api/v1")
PROTECTED = Depends(get_current_user)


api_v1_routers.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_routers.include_router(users_router, prefix="/users", tags=["users"], dependencies=[PROTECTED])
api_v1_routers.include_router(universities_router, prefix="/universities", tags=["universities"], dependencies=[PROTECTED])
api_v1_routers.include_router(like_router, prefix="/likes", tags=["likes"], dependencies=[PROTECTED])
api_v1_routers.include_router(appearance_rating_router, prefix="/appearance-ratings", tags=["appearance-ratings"], dependencies=[PROTECTED])
api_v1_routers.include_router(chat_router, prefix="/chats", tags=["chats"])
api_v1_routers.include_router(presence_router, prefix="/presence", tags=["presence"])
api_v1_routers.include_router(report_router, prefix="/reports", tags=["reports"])
api_v1_routers.include_router(cities_router, prefix="/cities", tags=["cities"], dependencies=[PROTECTED])
api_v1_routers.include_router(filters_router, prefix="/filters", tags=["filters"], dependencies=[PROTECTED])
api_v1_routers.include_router(tarot_router, prefix="/tarot", tags=["tarot"], dependencies=[PROTECTED])
api_v1_routers.include_router(telegram_router, prefix="/telegram", tags=["telegram"])