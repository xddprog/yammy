from datetime import datetime, timezone
from uuid import UUID

from pydantic import ValidationError

from app.core.clients.openrouter_client import OpenRouterClient
from app.core.dto.tarot_compatibility import (
    TarotCompatibilityCreateRequest,
    TarotCompatibilityItemSchema,
    TarotCompatibilityListResponse,
    TarotCompatibilityResultSchema,
    TarotCompatibilityWithPartnerResponse,
)
from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.tarot_compatibility_history_repository import TarotCompatibilityHistoryRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.config.config import TAROT_COMPATIBILITY_CONFIG
from app.infrastructure.database.models.tarot_compatibility_history import TarotCompatibilityHistory
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.base import BadRequestException, ConflictException, NotFoundException
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.enums import AiSearchHistoryStatusEnum


logger = get_logger(__name__)

MSG_TAROT_FAILED = "Не удалось сделать расклад. Попробуйте позже."
MSG_TAROT_DAILY_LIMIT = "Сегодня вы уже сделали расклад. Вернитесь завтра."
MSG_TAROT_NO_MATCH = "Расклад доступен только для ваших матчей."


class TarotCompatibilityService:
    def __init__(
        self,
        tarot_history_repository: TarotCompatibilityHistoryRepository,
        user_repository: UserRepository,
        like_repository: LikeRepository,
        openrouter_client: OpenRouterClient,
    ):
        self.tarot_history_repository = tarot_history_repository
        self.user_repository = user_repository
        self.like_repository = like_repository
        self.openrouter_client = openrouter_client

    @staticmethod
    def _utc_day_start() -> datetime:
        now = datetime.now(timezone.utc)
        return now.replace(hour=0, minute=0, second=0, microsecond=0)

    async def _remaining_today(self, user: User) -> int:
        used = await self.tarot_history_repository.count_since(user.id, self._utc_day_start())
        return max(0, TAROT_COMPATIBILITY_CONFIG.DAILY_LIMIT - used)

    async def list_history(self, user: User) -> TarotCompatibilityListResponse:
        items = await self.tarot_history_repository.list_by_user(user.id)
        remaining_today = await self._remaining_today(user)
        return TarotCompatibilityListResponse(
            items=[self._to_item_schema(item) for item in items],
            remaining_today=remaining_today,
        )

    async def get_with_partner(
        self,
        user: User,
        partner_user_id: UUID,
    ) -> TarotCompatibilityWithPartnerResponse:
        await self._ensure_valid_partner(user.id, partner_user_id)
        latest = await self.tarot_history_repository.get_latest_for_pair(user.id, partner_user_id)
        remaining_today = await self._remaining_today(user)
        item = self._to_item_schema(latest) if latest is not None else None
        return TarotCompatibilityWithPartnerResponse(item=item, remaining_today=remaining_today)

    async def get_history_item(self, user: User, history_id: UUID) -> TarotCompatibilityItemSchema:
        item = await self.tarot_history_repository.get_by_id_and_user(history_id, user.id)
        if item is None:
            raise NotFoundException("Расклад не найден")
        return self._to_item_schema(item)

    async def create_history_item(
        self,
        user: User,
        request: TarotCompatibilityCreateRequest,
    ) -> TarotCompatibilityItemSchema:
        partner_user_id = request.partner_user_id
        await self._ensure_valid_partner(user.id, partner_user_id)

        existing_ready = await self.tarot_history_repository.get_latest_ready_for_pair(
            user.id,
            partner_user_id,
        )
        if existing_ready is not None:
            return self._to_item_schema(existing_ready)

        latest = await self.tarot_history_repository.get_latest_for_pair(user.id, partner_user_id)
        if latest is not None and latest.status == AiSearchHistoryStatusEnum.SEARCHING:
            return self._to_item_schema(latest)

        if await self._remaining_today(user) <= 0:
            raise ConflictException(MSG_TAROT_DAILY_LIMIT)

        partner = await self.user_repository.get_item(str(partner_user_id))
        if partner is None:
            raise NotFoundException("Партнёр не найден")

        history = await self.tarot_history_repository.add_item(
            user_id=user.id,
            partner_user_id=partner_user_id,
            status=AiSearchHistoryStatusEnum.SEARCHING,
            result_json=None,
            error_message=None,
            completed_at=None,
        )
        return self._to_item_schema(history)

    async def process_history_item(self, history_id: UUID) -> None:
        history_id_str = str(history_id)
        item = await self.tarot_history_repository.get_item(history_id_str)
        if item is None:
            return
        if item.status != AiSearchHistoryStatusEnum.SEARCHING:
            return

        seeker = await self.user_repository.get_user_with_filters(item.user_id)
        partner = await self.user_repository.get_user_with_filters(item.partner_user_id)
        if seeker is None or partner is None:
            logger.error(
                "tarot_compatibility_user_not_found",
                history_id=history_id_str,
                user_id=str(item.user_id),
                partner_user_id=str(item.partner_user_id),
            )
            await self._mark_failed(item.id, MSG_TAROT_FAILED)
            return

        try:
            result = await self.openrouter_client.generate_tarot_compatibility_reading(
                seeker_profile=self._compact_profile(seeker),
                partner_profile=self._compact_profile(partner),
            )
            TarotCompatibilityResultSchema.model_validate(result)
            await self.tarot_history_repository.update_item(
                history_id_str,
                status=AiSearchHistoryStatusEnum.READY,
                result_json=result,
                error_message=None,
                completed_at=datetime.now(timezone.utc),
            )
            logger.info(
                "tarot_compatibility_completed",
                history_id=history_id_str,
                user_id=str(item.user_id),
                partner_user_id=str(item.partner_user_id),
                compatibility_score=result.get("compatibility_score"),
            )
        except (ValidationError, ValueError, RuntimeError):
            logger.exception("tarot_compatibility_processing_error", history_id=history_id_str)
            await self._mark_failed(item.id, MSG_TAROT_FAILED)
        except Exception:
            logger.exception("tarot_compatibility_unexpected_error", history_id=history_id_str)
            await self._mark_failed(item.id, MSG_TAROT_FAILED)

    async def _ensure_valid_partner(self, user_id: UUID, partner_user_id: UUID) -> None:
        if partner_user_id == user_id:
            raise BadRequestException("Нельзя сделать расклад с самим собой")
        if not await self.like_repository.has_match(user_id, partner_user_id):
            raise NotFoundException(MSG_TAROT_NO_MATCH)

    async def _mark_failed(self, history_id: UUID, reason: str) -> None:
        await self.tarot_history_repository.update_item(
            str(history_id),
            status=AiSearchHistoryStatusEnum.FAILED,
            error_message=reason,
            completed_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def _compact_profile(user: User) -> dict:
        traits: list[str] = []
        filters = getattr(user, "filters", None) or []
        for option in filters[:15]:
            traits.append(getattr(option, "name", str(option.id)))

        return {
            "name": user.name,
            "age": user.age,
            "gender": user.gender.value if user.gender else None,
            "city": user.city,
            "relationship_goal": user.relationship_goal.value if user.relationship_goal else None,
            "job": user.job,
            "job_sphere": user.job_sphere.value if user.job_sphere else None,
            "bio": (user.bio or "")[:260],
            "traits": traits,
        }

    @staticmethod
    def _to_item_schema(item: TarotCompatibilityHistory) -> TarotCompatibilityItemSchema:
        result_json = None
        if item.result_json:
            try:
                result_json = TarotCompatibilityResultSchema.model_validate(item.result_json)
            except ValidationError:
                result_json = None

        return TarotCompatibilityItemSchema(
            id=item.id,
            partner_user_id=item.partner_user_id,
            status=item.status,
            result_json=result_json,
            error_message=item.error_message,
            created_at=item.created_at,
            completed_at=item.completed_at,
        )
