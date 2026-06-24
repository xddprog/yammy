from uuid import UUID

from sqlalchemy import func, or_, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload, selectinload

from app.core.dto.pagination import PaginationRequestModel
from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.ai_search_history import AiSearchHistory
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models.filter import UserFilterAssociation
from app.infrastructure.database.models.like import Like
from app.infrastructure.database.models.match import Match
from app.infrastructure.database.models.message import Message
from app.infrastructure.database.models.report import Report
from app.infrastructure.database.models.user import User, UserPhoto
from app.utils.constants.enums import (
    EducationLevelEnum,
    GenderEnum,
    JobSphereEnum,
    LikeTypeEnum,
    ProfileModerationStatusEnum,
    RelationshipGoalEnum,
    ReportStatusEnum,
    SubscriptionTierEnum,
)
from app.utils.helpers.url_helper import get_absolute_url


class AdminUserRepository(SqlAlchemyRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def search_users(
        self,
        pagination: PaginationRequestModel,
        *,
        q: str | None = None,
        city: str | None = None,
        gender: GenderEnum | None = None,
        age_min: int | None = None,
        age_max: int | None = None,
        relationship_goal: RelationshipGoalEnum | None = None,
        job_spheres: list[JobSphereEnum] | None = None,
        education_levels: list[EducationLevelEnum] | None = None,
        education_details: str | None = None,
        is_banned: bool | None = None,
        subscription_tier: str | None = None,
        only_premium: bool | None = None,
        profile_moderation_status: ProfileModerationStatusEnum | None = None,
        profile_moderation_approved: bool | None = None,
        filter_option_ids: list[UUID] | None = None,
    ) -> tuple[int, list[User]]:
        stmt = select(User).options(joinedload(User.main_photo))
        if q:
            q = q.strip()
            filters = [User.name.ilike(f"%{q}%")]
            if q.isdigit():
                filters.append(User.telegram_id == int(q))
            try:
                filters.append(User.id == UUID(q))
            except ValueError:
                pass
            stmt = stmt.where(or_(*filters))
        if city:
            stmt = stmt.where(User.city.ilike(f"%{city.strip()}%"))
        if gender is not None:
            stmt = stmt.where(User.gender == gender)
        if age_min is not None:
            stmt = stmt.where(User.age >= age_min)
        if age_max is not None:
            stmt = stmt.where(User.age <= age_max)
        if relationship_goal is not None:
            stmt = stmt.where(User.relationship_goal == relationship_goal)
        if job_spheres:
            stmt = stmt.where(User.job_sphere.in_(job_spheres))
        if education_levels:
            stmt = stmt.where(User.education_level.in_(education_levels))
        if education_details:
            stmt = stmt.where(User.education_details.ilike(f"%{education_details.strip()}%"))
        if is_banned is not None:
            stmt = stmt.where(User.is_banned.is_(is_banned))
        if subscription_tier:
            stmt = stmt.where(User.subscription_tier == subscription_tier)
        if only_premium:
            stmt = stmt.where(User.subscription_tier != SubscriptionTierEnum.FREE)
        if profile_moderation_status is not None:
            stmt = stmt.where(User.profile_moderation_status == profile_moderation_status)
        elif profile_moderation_approved is not None:
            if profile_moderation_approved:
                stmt = stmt.where(User.profile_moderation_status == ProfileModerationStatusEnum.APPROVED)
            else:
                stmt = stmt.where(User.profile_moderation_status != ProfileModerationStatusEnum.APPROVED)
        if filter_option_ids:
            option_ids = list(dict.fromkeys(filter_option_ids))
            stmt = stmt.where(
                User.id.in_(
                    select(UserFilterAssociation.user_id)
                    .where(UserFilterAssociation.option_id.in_(option_ids))
                    .group_by(UserFilterAssociation.user_id)
                    .having(func.count(UserFilterAssociation.option_id.distinct()) == len(option_ids))
                )
            )
        stmt = stmt.order_by(User.created_at.desc()).offset(pagination.offset).limit(pagination.size)
        result = await self.session.execute(stmt)
        rows = result.scalars().unique().all()
        if not rows:
            return 0, []
        total = await self.get_total(stmt)
        return total, rows

    async def get_user_detail(self, user_id: UUID) -> User | None:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(joinedload(User.photos), joinedload(User.main_photo))
        )
        result = await self.session.execute(stmt)
        return result.scalars().unique().one_or_none()

    async def count_sent_likes(self, user_id: UUID) -> int:
        q = select(func.count(Like.user_to_id)).where(
            Like.user_from_id == user_id,
            Like.like_type.in_((LikeTypeEnum.LIKE, LikeTypeEnum.SUPERLIKE)),
        )
        return int((await self.session.scalar(q)) or 0)

    async def count_reports_received(self, user_id: UUID) -> int:
        q = select(func.count(Report.id)).where(Report.reported_id == user_id)
        return int((await self.session.scalar(q)) or 0)

    async def count_reports_sent(self, user_id: UUID) -> int:
        q = select(func.count(Report.id)).where(Report.reporter_id == user_id)
        return int((await self.session.scalar(q)) or 0)

    async def count_messages_sent(self, user_id: UUID) -> int:
        q = select(func.count(Message.id)).where(Message.sender_id == user_id)
        return int((await self.session.scalar(q)) or 0)

    async def count_ai_search_jobs(self, user_id: UUID) -> int:
        q = select(func.count(AiSearchHistory.id)).where(AiSearchHistory.user_id == user_id)
        return int((await self.session.scalar(q)) or 0)

    async def list_pending_moderation(
        self,
        pagination: PaginationRequestModel,
    ) -> tuple[int, list[User]]:
        stmt = (
            select(User)
            .where(User.profile_moderation_status == ProfileModerationStatusEnum.PENDING)
            .options(joinedload(User.main_photo))
            .order_by(User.updated_at.desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().unique().all()
        if not rows:
            return 0, []
        total = await self.get_total(stmt)
        return total, rows

    async def list_reported_users(
        self,
        pagination: PaginationRequestModel,
        *,
        has_pending: bool = True,
        q: str | None = None,
    ) -> tuple[int, list[dict]]:
        Reporter = aliased(User)
        reported = User
        stmt = (
            select(
                reported,
                func.count(Report.id).label("total_reports_count"),
                func.count(Report.id)
                .filter(Report.status == ReportStatusEnum.PENDING)
                .label("pending_reports_count"),
                func.max(Report.created_at).label("last_report_at"),
            )
            .join(Report, Report.reported_id == reported.id)
            .group_by(reported.id)
        )
        if has_pending:
            stmt = stmt.having(
                func.count(Report.id).filter(Report.status == ReportStatusEnum.PENDING) > 0
            )
        if q:
            stmt = stmt.where(reported.name.ilike(f"%{q.strip()}%"))
        stmt = stmt.order_by(
            func.count(Report.id).filter(Report.status == ReportStatusEnum.PENDING).desc(),
            func.max(Report.created_at).desc(),
        ).offset(pagination.offset).limit(pagination.size)

        result = await self.session.execute(stmt)
        rows = []
        for user, total_count, pending_count, last_at in result.all():
            await self.session.refresh(user, ["main_photo"])
            rows.append(
                {
                    "user": user,
                    "total_reports_count": int(total_count),
                    "pending_reports_count": int(pending_count),
                    "last_report_at": last_at,
                }
            )
        if not rows:
            return 0, []
        count_stmt = select(func.count()).select_from(stmt.limit(None).offset(None).subquery())
        total = int((await self.session.scalar(count_stmt)) or 0)
        return total, rows

    async def list_reports_for_user(
        self,
        user_id: UUID,
        status: ReportStatusEnum | None = None,
    ) -> list[dict]:
        Reporter = aliased(User)
        stmt = (
            select(Report, Reporter.name)
            .join(Reporter, Reporter.id == Report.reporter_id)
            .where(Report.reported_id == user_id)
            .order_by(Report.created_at.desc())
        )
        if status:
            stmt = stmt.where(Report.status == status)
        result = await self.session.execute(stmt)
        return [{"report": row[0], "reporter_name": row[1]} for row in result.all()]

    async def get_chat_between_users(self, user_a: UUID, user_b: UUID) -> Chat | None:
        stmt = (
            select(Chat)
            .join(Match, Match.id == Chat.match_id)
            .where(
                or_(
                    and_(Match.user1_id == user_a, Match.user2_id == user_b),
                    and_(Match.user1_id == user_b, Match.user2_id == user_a),
                )
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_chat_messages(self, chat_id: UUID, *, limit: int = 100) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .options(joinedload(Message.sender), selectinload(Message.images))
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    @staticmethod
    def photo_url(user: User) -> str | None:
        if user.main_photo and user.main_photo.file_path:
            return get_absolute_url(user.main_photo.file_path)
        return None
