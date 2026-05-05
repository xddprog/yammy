from dishka import FromDishka
from dishka.integrations.fastapi import inject
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate

from app.core.dto.moderation import ModerateTextRequest
from app.core.services import ModerationService
from app.utils.error_extra import error_response
from app.infrastructure.errors.image_errors import ImageProcessingError
from app.infrastructure.errors.moderation_errors import TextModerationError



router = APIRouter()



@router.post(
    "/moderate-image",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=10, interval=Duration.MINUTE))))
    ],
    responses={**error_response(ImageProcessingError)}
)
@inject
async def moderate_image(
    moderation_service: FromDishka[ModerationService],
    image: UploadFile = File(...),
) -> bool:
    return await moderation_service.moderate_image(image)


@router.post(
    "/moderate-text",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=10, interval=Duration.MINUTE))))
    ],
    responses={**error_response(TextModerationError)}
)
@inject
async def moderate_text(
    request: ModerateTextRequest,
    moderation_service: FromDishka[ModerationService],
) -> bool:
    return await moderation_service.moderate_text(request.text)
