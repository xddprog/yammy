from datetime import datetime, timezone
from uuid import UUID

from app.core.clients.openrouter_client import OpenRouterClient
from app.core.dto.ai_search import (
    AiSearchCreateRequest,
    AiSearchFeedResponse,
    AiSearchFeedUserWithHighlight,
    AiSearchHistoryItemSchema,
    AiSearchHistoryListResponse,
)
from app.core.dto.user import UserSearchResponseSchema
from app.core.repositories.ai_search_history_repository import AiSearchHistoryRepository
from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.errors.base import ConflictException, NotFoundException
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.enums import AiSearchHistoryStatusEnum, SubscriptionTierEnum
from app.infrastructure.config.config import AI_SEARCH_CONFIG
from app.infrastructure.database.models.user import User


logger = get_logger(__name__)

MSG_AI_SEARCH_FAILED = "Не удалось выполнить поиск. Попробуйте позже."
MSG_AI_SEARCH_NO_CANDIDATES = "Не удалось подобрать анкеты по запросу"
MSG_AI_SEARCH_NO_VIEWABLE_CANDIDATES = (
    "Подобранные анкеты уже были оценены ранее. Запустите поиск ещё раз."
)


class AiSearchService:
    def __init__(
        self,
        ai_search_history_repository: AiSearchHistoryRepository,
        user_repository: UserRepository,
        like_repository: LikeRepository,
        openrouter_client: OpenRouterClient,
    ):
        self.ai_search_history_repository = ai_search_history_repository
        self.user_repository = user_repository
        self.like_repository = like_repository
        self.openrouter_client = openrouter_client

    def _daily_limit(self, user: User) -> int:
        tier = user.subscription_tier
        if tier == SubscriptionTierEnum.PREMIUM:
            return AI_SEARCH_CONFIG.DAILY_LIMIT_PREMIUM
        if tier == SubscriptionTierEnum.VIP:
            return AI_SEARCH_CONFIG.DAILY_LIMIT_VIP
        return AI_SEARCH_CONFIG.DAILY_LIMIT_FREE

    @staticmethod
    def _utc_day_start() -> datetime:
        now = datetime.now(timezone.utc)
        return now.replace(hour=0, minute=0, second=0, microsecond=0)

    async def _remaining_today(self, user: User) -> int:
        used = await self.ai_search_history_repository.count_since(user.id, self._utc_day_start())
        return max(0, self._daily_limit(user) - used)

    async def create_history_item(self, user: User, request: AiSearchCreateRequest) -> AiSearchHistoryItemSchema:
        if await self._remaining_today(user) <= 0:
            raise ConflictException("Дневной лимит запусков исчерпан")

        query_text = request.query_text.strip()
        history = await self.ai_search_history_repository.add_item(
            user_id=user.id,
            query_text=query_text,
            status=AiSearchHistoryStatusEnum.SEARCHING,
            result_count=None,
            results_json=None,
            error_message=None,
            completed_at=None,
        )
        return AiSearchHistoryItemSchema.model_validate(history, from_attributes=True)

    async def list_history(self, user: User) -> AiSearchHistoryListResponse:
        items = await self.ai_search_history_repository.list_by_user(user.id)
        remaining_today = await self._remaining_today(user)
        return AiSearchHistoryListResponse(
            items=[AiSearchHistoryItemSchema.model_validate(item, from_attributes=True) for item in items],
            remaining_today=remaining_today,
        )

    async def get_history_item(self, user: User, history_id: UUID) -> AiSearchHistoryItemSchema:
        item = await self.ai_search_history_repository.get_by_id_and_user(history_id, user.id)
        if item is None:
            raise NotFoundException("Запуск поиска не найден")
        return AiSearchHistoryItemSchema.model_validate(item, from_attributes=True)

    async def get_feed(self, user: User, history_id: UUID) -> AiSearchFeedResponse:
        item = await self.ai_search_history_repository.get_by_id_and_user(history_id, user.id)
        if item is None:
            raise NotFoundException("Запуск поиска не найден")
        if not self._has_feed_results(item):
            raise ConflictException("Результат ещё не готов")

        if item.status == AiSearchHistoryStatusEnum.FAILED:
            await self.ai_search_history_repository.update_item(
                str(item.id),
                status=AiSearchHistoryStatusEnum.READY,
                error_message=None,
            )

        raw_results = item.results_json or []
        interacted_ids = {
            str(uid) for uid in await self.like_repository.get_outgoing_interaction_user_ids(user.id)
        }
        viewable_results = self._filter_viewable_results(raw_results, interacted_ids)

        ordered_ids: list[UUID] = []
        highlights: dict[str, str] = {}
        match_percentages: dict[str, int] = {}
        for result in viewable_results:
            cid = result.get("id")
            if not cid:
                continue
            try:
                uid = UUID(str(cid))
            except ValueError:
                continue
            ordered_ids.append(uid)
            highlights[str(uid)] = str(result.get("highlights") or "Подходит по вашему запросу")
            try:
                match_percentages[str(uid)] = int(result.get("match_percentage", 0))
            except (TypeError, ValueError):
                match_percentages[str(uid)] = 0

        users = await self.user_repository.get_users_for_search_feed_by_ids(ordered_ids)
        user_map = {str(u.id): u for u in users}

        feed_items: list[AiSearchFeedUserWithHighlight] = []
        for uid in ordered_ids:
            uid_str = str(uid)
            candidate = user_map.get(uid_str)
            if candidate is None:
                continue
            user_schema = UserSearchResponseSchema.model_validate(candidate, from_attributes=True)
            match_pct = match_percentages.get(uid_str, 0)
            user_schema.match_percentage = match_pct
            feed_items.append(
                AiSearchFeedUserWithHighlight(
                    user=user_schema,
                    highlights=highlights.get(uid_str, "Подходит по вашему запросу"),
                    match_percentage=match_pct,
                )
            )
        viewer_id = user.id
        logger.info(
            "ai_search_feed_built",
            history_id=str(history_id),
            user_id=str(viewer_id),
            items=len(feed_items),
            excluded_interactions=len(interacted_ids),
        )
        return AiSearchFeedResponse(items=feed_items)

    async def process_history_item(self, history_id: UUID) -> None:
        history_id_str = str(history_id)
        item = await self.ai_search_history_repository.get_item(history_id_str)
        if item is None:
            return
        if item.status != AiSearchHistoryStatusEnum.SEARCHING:
            return

        item_id = item.id
        user_id = item.user_id
        query_text = item.query_text

        user = await self.user_repository.get_item(str(user_id))
        if user is None:
            logger.error("ai_search_user_not_found", history_id=history_id_str, user_id=str(user_id))
            await self._mark_failed(item_id, MSG_AI_SEARCH_FAILED)
            return

        seeker_profile = self._compact_seeker(user)
        user_id_str = str(user_id)

        results: list[dict] = []
        try:
            results = await self._collect_candidates(
                user_id=user_id,
                seeker_profile=seeker_profile,
                query_text=query_text,
            )
            if not results:
                await self._mark_failed(item_id, MSG_AI_SEARCH_NO_CANDIDATES)
                return
            await self._mark_ready(item_id, user_id, results)
            logger.info(
                "ai_search_history_completed",
                history_id=history_id_str,
                user_id=user_id_str,
                result_count=len(results),
            )
        except Exception:
            logger.exception("ai_search_history_processing_error", history_id=history_id_str)
            if results:
                await self._mark_ready(item_id, user_id, results)
                logger.warning(
                    "ai_search_history_completed_after_error",
                    history_id=history_id_str,
                    result_count=len(results),
                )
            else:
                await self._mark_failed(item_id, MSG_AI_SEARCH_FAILED)

    @staticmethod
    def _has_feed_results(item) -> bool:
        return bool(item.results_json) and (item.result_count or 0) > 0

    @staticmethod
    def _filter_viewable_results(results: list[dict], interacted_ids: set[str]) -> list[dict]:
        viewable: list[dict] = []
        for result in results:
            candidate_id = result.get("id")
            if not candidate_id or str(candidate_id) in interacted_ids:
                continue
            viewable.append(result)
        return viewable

    async def _mark_ready(self, history_id: UUID, user_id: UUID, results: list[dict]) -> None:
        interacted_ids = {
            str(uid) for uid in await self.like_repository.get_outgoing_interaction_user_ids(user_id)
        }
        viewable_results = self._filter_viewable_results(results, interacted_ids)
        if not viewable_results:
            await self._mark_failed(history_id, MSG_AI_SEARCH_NO_VIEWABLE_CANDIDATES)
            return

        await self.ai_search_history_repository.update_item(
            str(history_id),
            status=AiSearchHistoryStatusEnum.READY,
            result_count=len(viewable_results),
            results_json=viewable_results,
            completed_at=datetime.now(timezone.utc),
            error_message=None,
        )

    async def _mark_failed(self, history_id: UUID, reason: str) -> None:
        item = await self.ai_search_history_repository.get_item(str(history_id))
        if item is not None and self._has_feed_results(item):
            logger.warning(
                "ai_search_skip_failed_has_results",
                history_id=str(history_id),
                result_count=item.result_count,
            )
            await self.ai_search_history_repository.update_item(
                str(history_id),
                status=AiSearchHistoryStatusEnum.READY,
                error_message=None,
            )
            return

        await self.ai_search_history_repository.update_item(
            str(history_id),
            status=AiSearchHistoryStatusEnum.FAILED,
            error_message=reason,
            completed_at=datetime.now(timezone.utc),
        )
        logger.info(
            "ai_search_history_failed",
            history_id=str(history_id),
            user_message=reason,
        )

    async def _collect_candidates(
        self,
        *,
        user_id: UUID,
        seeker_profile: dict,
        query_text: str,
    ) -> list[dict]:
        unique: dict[str, dict] = {}
        excluded_ids = await self._get_excluded_candidate_ids(user_id)
        user_id_str = str(user_id)
        llm_calls = 0

        while len(unique) < AI_SEARCH_CONFIG.MIN_RESULTS and llm_calls < AI_SEARCH_CONFIG.MAX_LLM_CALLS_PER_HISTORY_ITEM:
            batch_users = await self.user_repository.get_random_users_with_photos(
                exclude_user_ids=list(excluded_ids),
                limit=AI_SEARCH_CONFIG.CANDIDATE_BATCH_SIZE,
            )
            if not batch_users:
                break

            compact_batch = [self._compact_candidate(candidate) for candidate in batch_users]
            selected = await self.openrouter_client.pick_candidates_with_highlights(
                query_text=query_text,
                seeker_profile=seeker_profile,
                candidates=compact_batch,
                min_count=max(1, AI_SEARCH_CONFIG.MIN_RESULTS - len(unique)),
            )
            llm_calls += 1
            logger.info(
                "ai_search_llm_batch_completed",
                user_id=user_id_str,
                llm_call=llm_calls,
                batch_selected=len(selected),
                total_selected=len(unique) + len(selected),
            )

            for candidate in batch_users:
                excluded_ids.add(candidate.id)

            for item in selected:
                cid = str(item["id"])
                if cid in unique or cid in {str(uid) for uid in excluded_ids if str(uid) != user_id_str}:
                    continue
                if cid == user_id_str:
                    continue
                unique[cid] = {
                    "id": cid,
                    "highlights": str(item.get("highlights") or "Подходит по вашему запросу"),
                    "match_percentage": int(item.get("match_percentage", 0)),
                }

        results = list(unique.values())
        logger.info(
            "ai_search_candidates_collected",
            user_id=user_id_str,
            llm_calls=llm_calls,
            result_count=len(results),
            min_results=AI_SEARCH_CONFIG.MIN_RESULTS,
        )
        return results

    @staticmethod
    def _compact_candidate(candidate: User) -> dict:
        return {
            "id": str(candidate.id),
            "name": candidate.name,
            "age": candidate.age,
            "city": candidate.city,
            "job": candidate.job,
            "relationship_goal": candidate.relationship_goal.value if candidate.relationship_goal else None,
            "bio": (candidate.bio or "")[:220],
        }

    @staticmethod
    def _compact_seeker(user: User) -> dict:
        return {
            "id": str(user.id),
            "name": user.name,
            "age": user.age,
            "city": user.city,
            "gender": user.gender.value if user.gender else None,
            "relationship_goal": user.relationship_goal.value if user.relationship_goal else None,
            "job": user.job,
            "bio": (user.bio or "")[:260],
        }
