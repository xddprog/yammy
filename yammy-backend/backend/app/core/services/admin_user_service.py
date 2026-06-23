from datetime import datetime, timezone
from uuid import UUID

from app.core.dto.admin_user import (
    AdminChatMessageSchema,
    AdminReportItemSchema,
    AdminUserChatSchema,
    AdminUserDetailSchema,
    AdminUserPreviewSchema,
    AdminUserStatsSchema,
    ReportedUserDetailSchema,
    ReportedUserListItemSchema,
)
from app.core.dto.message import MessagePhotoSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.user import UserPhoto
from app.core.repositories.admin_user_repository import AdminUserRepository
from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.report_repository import ReportRepository
from app.core.services.user_index_service import UserIndexService
from app.core.services.adequacy_score_service import AdequacyScoreService
from app.infrastructure.database.models.subscription import SubscriptionHistory
from app.infrastructure.errors.base import NotFoundException
from app.infrastructure.logging import get_logger
from app.utils.constants.enums import ReportStatusEnum, SubscriptionTierEnum

logger = get_logger(__name__)


class AdminUserService:
    def __init__(
        self,
        admin_user_repository: AdminUserRepository,
        like_repository: LikeRepository,
        report_repository: ReportRepository,
        user_index_service: UserIndexService,
        adequacy_score_service: AdequacyScoreService,
    ):
        self.admin_user_repository = admin_user_repository
        self.like_repository = like_repository
        self.report_repository = report_repository
        self.user_index_service = user_index_service
        self.adequacy_score_service = adequacy_score_service

    def _preview(self, user) -> AdminUserPreviewSchema:
        return AdminUserPreviewSchema(
            id=user.id,
            name=user.name,
            age=user.age,
            city=user.city,
            is_banned=user.is_banned,
            subscription_tier=user.subscription_tier,
            profile_moderation_approved=user.profile_moderation_approved,
            last_seen=user.last_seen,
            created_at=user.created_at,
            main_photo=AdminUserRepository.photo_url(user),
        )

    async def _build_stats(self, user_id: UUID, profile_views: int) -> AdminUserStatsSchema:
        return AdminUserStatsSchema(
            received_likes_count=await self.like_repository.count_received_likes(user_id),
            matches_count=await self.like_repository.count_matches(user_id),
            profile_views_count=profile_views,
            sent_likes_count=await self.admin_user_repository.count_sent_likes(user_id),
            reports_received_count=await self.admin_user_repository.count_reports_received(user_id),
            reports_sent_count=await self.admin_user_repository.count_reports_sent(user_id),
            messages_sent_count=await self.admin_user_repository.count_messages_sent(user_id),
            ai_search_jobs_count=await self.admin_user_repository.count_ai_search_jobs(user_id),
        )

    async def _build_detail(self, user) -> AdminUserDetailSchema:
        photos = sorted(user.photos or [], key=lambda p: p.order)
        return AdminUserDetailSchema(
            id=user.id,
            telegram_id=user.telegram_id,
            name=user.name,
            age=user.age,
            gender=user.gender.value,
            city=user.city,
            bio=user.bio,
            relationship_goal=user.relationship_goal.value,
            is_banned=user.is_banned,
            profile_moderation_approved=user.profile_moderation_approved,
            subscription_tier=user.subscription_tier,
            subscription_expires_at=user.subscription_expires_at,
            superlikes_balance=user.superlikes_balance,
            boosts_balance=user.boosts_balance,
            boost_expires_at=user.boost_expires_at,
            last_seen=user.last_seen,
            created_at=user.created_at,
            main_photo=AdminUserRepository.photo_url(user),
            photos=[UserPhoto.model_validate(p, from_attributes=True) for p in photos],
            stats=await self._build_stats(user.id, user.profile_views_count),
        )

    async def search_users(
        self,
        pagination: PaginationRequestModel,
        **filters,
    ) -> PaginationResponseModel[AdminUserPreviewSchema]:
        total, rows = await self.admin_user_repository.search_users(pagination, **filters)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[self._preview(u) for u in rows],
        )

    async def get_user_detail(self, user_id: UUID) -> AdminUserDetailSchema:
        user = await self.admin_user_repository.get_user_detail(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        return await self._build_detail(user)

    async def list_moderation_profiles(
        self,
        pagination: PaginationRequestModel,
    ) -> PaginationResponseModel[AdminUserPreviewSchema]:
        total, rows = await self.admin_user_repository.list_pending_moderation(pagination)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[self._preview(u) for u in rows],
        )

    async def get_moderation_profile(self, user_id: UUID) -> AdminUserDetailSchema:
        return await self.get_user_detail(user_id)

    async def set_profile_moderation(
        self,
        user_id: UUID,
        approved: bool,
        note: str | None,
        staff_id: UUID,
    ) -> None:
        user = await self.admin_user_repository.get_item(str(user_id))
        if not user:
            raise NotFoundException("Пользователь не найден")
        await self.admin_user_repository.update_item(
            str(user_id),
            profile_moderation_approved=approved,
        )
        logger.info(
            "admin_profile_moderation",
            staff_id=str(staff_id),
            user_id=str(user_id),
            approved=approved,
            note=note,
        )

    async def list_reported_users(
        self,
        pagination: PaginationRequestModel,
        *,
        has_pending: bool = True,
        q: str | None = None,
    ) -> PaginationResponseModel[ReportedUserListItemSchema]:
        total, rows = await self.admin_user_repository.list_reported_users(
            pagination,
            has_pending=has_pending,
            q=q,
        )
        items = [
            ReportedUserListItemSchema(
                user=self._preview(row["user"]),
                total_reports_count=row["total_reports_count"],
                pending_reports_count=row["pending_reports_count"],
                last_report_at=row["last_report_at"],
            )
            for row in rows
        ]
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=items,
        )

    async def get_reported_user_detail(self, user_id: UUID) -> ReportedUserDetailSchema:
        user = await self.admin_user_repository.get_user_detail(user_id)
        if not user:
            raise NotFoundException("Пользователь не найден")
        report_rows = await self.admin_user_repository.list_reports_for_user(user_id)
        reports = [
            AdminReportItemSchema(
                id=row["report"].id,
                reason=row["report"].reason,
                comment=row["report"].comment,
                status=row["report"].status,
                created_at=row["report"].created_at,
                reviewed_at=row["report"].reviewed_at,
                review_note=row["report"].review_note,
                reporter_id=row["report"].reporter_id,
                reporter_name=row["reporter_name"],
            )
            for row in report_rows
        ]
        return ReportedUserDetailSchema(
            user=await self._build_detail(user),
            reports=reports,
        )

    async def list_user_reports(self, user_id: UUID) -> list[AdminReportItemSchema]:
        detail = await self.get_reported_user_detail(user_id)
        return detail.reports

    async def get_chat_between_users(
        self,
        user_a: UUID,
        user_b: UUID,
    ) -> AdminUserChatSchema:
        chat = await self.admin_user_repository.get_chat_between_users(user_a, user_b)
        if not chat:
            return AdminUserChatSchema(has_chat=False)

        rows = await self.admin_user_repository.list_chat_messages(chat.id)
        messages = [
            AdminChatMessageSchema(
                id=message.id,
                sender_id=message.sender_id,
                sender_name=message.sender.name if message.sender else "—",
                content="Сообщение удалено" if message.is_deleted else message.content,
                created_at=message.created_at,
                is_deleted=message.is_deleted,
                is_edited=message.is_edited,
                images=[] if message.is_deleted else [
                    MessagePhotoSchema.model_validate(photo, from_attributes=True)
                    for photo in sorted(message.images, key=lambda photo: photo.order)
                ],
            )
            for message in rows
        ]
        return AdminUserChatSchema(has_chat=True, chat_id=chat.id, messages=messages)

    async def update_report(
        self,
        report_id: UUID,
        status: ReportStatusEnum,
        review_note: str | None,
        staff_id: UUID,
    ) -> None:
        report = await self.report_repository.get_item(str(report_id))
        if not report:
            raise NotFoundException("Жалоба не найдена")

        old_status = report.status
        reported_id = report.reported_id
        penalty_applied = report.adequacy_penalty_applied

        await self.report_repository.update_item(
            str(report_id),
            status=status,
            review_note=review_note,
            reviewed_at=datetime.now(timezone.utc),
        )

        if status == ReportStatusEnum.DISMISSED and old_status != ReportStatusEnum.DISMISSED:
            if penalty_applied:
                await self.adequacy_score_service.restore_report_penalty(reported_id)
                await self.report_repository.update_item(
                    str(report_id),
                    adequacy_penalty_applied=False,
                )
        elif status != ReportStatusEnum.DISMISSED and old_status == ReportStatusEnum.DISMISSED:
            await self.adequacy_score_service.apply_report_penalty(reported_id)
            await self.report_repository.update_item(
                str(report_id),
                adequacy_penalty_applied=True,
            )

        logger.info(
            "admin_report_updated",
            staff_id=str(staff_id),
            report_id=str(report_id),
            status=status.value,
        )

    async def resolve_all_pending_reports(self, user_id: UUID, staff_id: UUID) -> int:
        rows = await self.admin_user_repository.list_reports_for_user(
            user_id,
            status=ReportStatusEnum.PENDING,
        )
        for row in rows:
            await self.update_report(
                row["report"].id,
                ReportStatusEnum.REVIEWED,
                None,
                staff_id,
            )
        return len(rows)

    async def set_subscription(
        self,
        user_id: UUID,
        tier: SubscriptionTierEnum,
        expires_at: datetime | None,
        staff_id: UUID,
    ) -> None:
        user = await self.admin_user_repository.get_item(str(user_id))
        if not user:
            raise NotFoundException("Пользователь не найден")
        now = datetime.now(timezone.utc)
        await self.admin_user_repository.update_item(
            str(user_id),
            subscription_tier=tier,
            subscription_expires_at=expires_at,
        )
        history = SubscriptionHistory(
            user_id=user_id,
            tier=tier,
            start_date=now,
            end_date=expires_at or now,
            transaction_id=None,
        )
        self.admin_user_repository.session.add(history)
        await self.admin_user_repository.session.commit()
        await self.user_index_service.upsert_user(user_id, include_personality_vector=False)
        logger.info(
            "admin_subscription_granted",
            staff_id=str(staff_id),
            user_id=str(user_id),
            tier=tier.value,
        )

    async def set_balances(
        self,
        user_id: UUID,
        *,
        superlikes_balance: int | None,
        boosts_balance: int | None,
        boost_expires_at: datetime | None,
        staff_id: UUID,
    ) -> None:
        user = await self.admin_user_repository.get_item(str(user_id))
        if not user:
            raise NotFoundException("Пользователь не найден")
        updates: dict = {}
        if superlikes_balance is not None:
            updates["superlikes_balance"] = superlikes_balance
        if boosts_balance is not None:
            updates["boosts_balance"] = boosts_balance
        if boost_expires_at is not None:
            updates["boost_expires_at"] = boost_expires_at
        if updates:
            await self.admin_user_repository.update_item(str(user_id), **updates)
        logger.info("admin_balances_updated", staff_id=str(staff_id), user_id=str(user_id), **updates)
