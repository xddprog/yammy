from typing import Any
from uuid import UUID

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload, load_only, noload, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models import Match, Message, User
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
                selectinload(Chat.messages).options(
                    selectinload(Message.sender).options(
                        joinedload(User.main_photo),
                        load_only(User.id, User.name, User.last_seen),
                    ),
                    selectinload(Message.images),
                    selectinload(Message.reply_to).options(
                        selectinload(Message.sender).options(
                            joinedload(User.main_photo),
                            load_only(User.id, User.name, User.last_seen),
                        ),
                        selectinload(Message.images),
                        noload(Message.reply_to),
                    ),
                ),
            )
        )
        result = await self.session.execute(query)
        row = result.one_or_none()
        if row is None:
            return None
        chat, peer = row
        chat.user_to = peer
        chat.messages = [message for message in chat.messages if not message.is_deleted]
        return chat

    async def list_for_user(self, user_id: UUID, pagination: PaginationRequestModel) -> tuple[int, list[Any]]:
        peer_id = case(
            (Match.user1_id == user_id, Match.user2_id),
            else_=Match.user1_id,
        )
        Peer = aliased(User, name="peer")

        last_message_ranked = (
            select(
                Message.chat_id,
                Message.content,
                func.row_number()
                .over(partition_by=Message.chat_id, order_by=Message.id.desc())
                .label("rn"),
            )
            .where(Message.is_deleted.is_(False))
            .subquery()
        )

        last_message = (
            select(
                last_message_ranked.c.chat_id,
                last_message_ranked.c.content,
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
                Message.is_deleted.is_(False),
                Message.is_read.is_(False),
                Message.sender_id != user_id,
            )
            .group_by(Message.chat_id)
            .subquery()
        )

        last_message_at = case(
            (last_message.c.content.isnot(None), func.coalesce(Chat.updated_at, Match.updated_at)),
            else_=None,
        )

        query = (
            select(
                Match.id.label("match_id"),
                Chat.id.label("chat_id"),
                Peer,
                last_message.c.content.label("last_message_content"),
                last_message_at.label("last_message_at"),
                func.coalesce(unread_counts.c.unread_count, 0).label("unread_count"),
            )
            .select_from(Match)
            .outerjoin(Chat, Chat.match_id == Match.id)
            .join(Peer, Peer.id == peer_id)
            .outerjoin(last_message, last_message.c.chat_id == Chat.id)
            .outerjoin(unread_counts, unread_counts.c.chat_id == Chat.id)
            .where(or_(Match.user1_id == user_id, Match.user2_id == user_id))
            .options(joinedload(Peer.main_photo))
            .order_by(func.coalesce(last_message_at, Match.updated_at).desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        
        result = await self.session.execute(query)
        rows = result.mappings().all()

        if not rows:
            return 0, []

        total = await self.get_total(query)
        return total, rows