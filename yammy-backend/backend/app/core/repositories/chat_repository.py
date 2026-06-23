from typing import Any
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload, noload, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models import Match, Message, User
from app.infrastructure.database.models.filter import FilterOption, FilterSubcategory
from app.core.dto.pagination import PaginationRequestModel


class ChatRepository(SqlAlchemyRepository[Chat]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Chat)

    async def get_chat_by_match_id(self, match_id: UUID, user_id: UUID) -> Chat | None:
        peer_id = case(
            (Match.user1_id == user_id, Match.user2_id),
            else_=Match.user1_id,
        )
        Peer = aliased(User, name="peer")

        query = (
            select(Chat, Peer)
            .join(Match, Match.id == Chat.match_id)
            .join(Peer, Peer.id == peer_id)
            .where(
                Match.id == match_id,
                or_(
                    Match.user1_id == user_id,
                    Match.user2_id == user_id
                )
            )
            .options(
                joinedload(Peer.main_photo),
                selectinload(Peer.photos),
                selectinload(Peer.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category),
                noload(Chat.messages),
            )
        )
        result = await self.session.execute(query)
        row = result.one_or_none()
        if row is None:
            return None
        chat, peer = row
        chat.user_to = peer
        return chat

    async def get_peer_user_id_by_chat_id(
        self,
        chat_id: UUID,
        user_id: UUID,
    ) -> UUID | None:
        peer_id = case(
            (Match.user1_id == user_id, Match.user2_id),
            else_=Match.user1_id,
        )
        query = (
            select(peer_id)
            .select_from(Chat)
            .join(Match, Match.id == Chat.match_id)
            .where(
                Chat.id == chat_id,
                or_(
                    Match.user1_id == user_id,
                    Match.user2_id == user_id,
                ),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_peer_ban_status_by_chat_id(
        self,
        chat_id: UUID,
        user_id: UUID,
    ) -> bool | None:
        peer_id = case(
            (Match.user1_id == user_id, Match.user2_id),
            else_=Match.user1_id,
        )
        Peer = aliased(User, name="peer")

        query = (
            select(Peer.is_banned)
            .select_from(Chat)
            .join(Match, Match.id == Chat.match_id)
            .join(Peer, Peer.id == peer_id)
            .where(
                Chat.id == chat_id,
                or_(
                    Match.user1_id == user_id,
                    Match.user2_id == user_id,
                ),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_chat_id_for_user_pair(
        self,
        user_id: UUID,
        partner_user_id: UUID,
    ) -> UUID | None:
        query = (
            select(Chat.id)
            .join(Match, Match.id == Chat.match_id)
            .where(
                or_(
                    and_(Match.user1_id == user_id, Match.user2_id == partner_user_id),
                    and_(Match.user1_id == partner_user_id, Match.user2_id == user_id),
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: UUID,
        pagination: PaginationRequestModel,
        name_query: str | None = None,
    ) -> tuple[int, list[Any]]:
        peer_id = case(
            (Match.user1_id == user_id, Match.user2_id),
            else_=Match.user1_id,
        )
        Peer = aliased(User, name="peer")

        last_message_ranked = (
            select(
                Message.chat_id,
                case(
                    (Message.is_deleted.is_(True), "Сообщение было удалено"),
                    else_=Message.content,
                ).label("content"),
                Message.created_at,
                func.row_number()
                .over(
                    partition_by=Message.chat_id,
                    order_by=(Message.created_at.desc(), Message.id.desc()),
                )
                .label("rn"),
            )
            .subquery()
        )

        last_message = (
            select(
                last_message_ranked.c.chat_id,
                last_message_ranked.c.content,
                last_message_ranked.c.created_at,
            )
            .where(last_message_ranked.c.rn == 1)
            .subquery()
        )

        unread_counts = (
            select(
                Message.chat_id,
                func.count().label("unread_count"),
            )
            .where(
                Message.is_read.is_(False),
                Message.sender_id != user_id,
            )
            .group_by(Message.chat_id)
            .subquery()
        )

        stmt = (
            select(
                Match.id.label("match_id"),
                Chat.id.label("chat_id"),
                Peer,
                last_message.c.content.label("last_message_content"),
                last_message.c.created_at.label("last_message_at"),
                func.coalesce(unread_counts.c.unread_count, 0).label("unread_count"),
            )
            .select_from(Match)
            .outerjoin(Chat, Chat.match_id == Match.id)
            .join(Peer, Peer.id == peer_id)
            .outerjoin(last_message, last_message.c.chat_id == Chat.id)
            .outerjoin(unread_counts, unread_counts.c.chat_id == Chat.id)
            .where(or_(Match.user1_id == user_id, Match.user2_id == user_id))
        )

        if name_query:
            stmt = stmt.where(Peer.name.ilike(f"%{name_query}%"))

        stmt = (
            stmt.options(joinedload(Peer.main_photo))
            .order_by(func.coalesce(last_message.c.created_at, Match.updated_at).desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )

        result = await self.session.execute(stmt)
        rows = result.mappings().all()

        if not rows:
            return 0, []

        total = await self.get_total(stmt)
        return total, rows