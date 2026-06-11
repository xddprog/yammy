#!/usr/bin/env python3
"""
Сброс всех взаимодействий между двумя пользователями (лайки, метчи, seen в Redis).

Примеры:
  cd yammy-backend/backend
  python scripts/reset_user_interactions.py --name-a mago --name-b Marif
  python scripts/reset_user_interactions.py --name-a mago --name-b Marif --telegram-id-a 5163648472
  python scripts/reset_user_interactions.py --id-a 58ad6383-fe79-4559-acbb-b7ba4f35f646 --id-b 353fc0ee-04d9-4b93-8856-926369b19277 --wipe-all
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from uuid import UUID

from sqlalchemy import and_, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.infrastructure.config.config import DB_CONFIG, REDIS_CONFIG  # noqa: E402
from app.infrastructure.database.models.chat import Chat  # noqa: E402
from app.infrastructure.database.models.like import Like  # noqa: E402
from app.infrastructure.database.models.match import Match  # noqa: E402
from app.infrastructure.database.models.message import Message, MessagePhoto  # noqa: E402
from app.infrastructure.database.models.user import User  # noqa: E402
from app.utils.constants.cache_keys import LikeCacheKeys, UserCacheKeys  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Сброс лайков/метчей/seen между двумя пользователями")
    parser.add_argument("--name-a", help="Имя первого пользователя (без учёта регистра)")
    parser.add_argument("--name-b", help="Имя второго пользователя (без учёта регистра)")
    parser.add_argument("--id-a", type=UUID, help="UUID первого пользователя")
    parser.add_argument("--id-b", type=UUID, help="UUID второго пользователя")
    parser.add_argument(
        "--telegram-id-a",
        type=int,
        help="Уточнить первого пользователя по telegram_id (если несколько с одним именем)",
    )
    parser.add_argument(
        "--telegram-id-b",
        type=int,
        help="Уточнить второго пользователя по telegram_id",
    )
    parser.add_argument("--dry-run", action="store_true", help="Только показать, что будет удалено")
    parser.add_argument(
        "--wipe-all",
        action="store_true",
        help="Удалить ВСЕ лайки/метчи/чаты для указанных пользователей (не только между собой)",
    )
    return parser.parse_args()


async def resolve_users(session: AsyncSession, args: argparse.Namespace) -> tuple[list[User], list[User]]:
    async def by_side(
        user_id: UUID | None,
        name: str | None,
        telegram_id: int | None,
        side: str,
    ) -> list[User]:
        if user_id:
            row = await session.get(User, user_id)
            if not row:
                raise SystemExit(f"Пользователь {side} не найден: {user_id}")
            return [row]

        if not name:
            raise SystemExit(f"Укажите --id-{side[-1]} или --name-{side[-1]}")

        query = select(User).where(User.name.ilike(name))
        if telegram_id is not None:
            query = query.where(User.telegram_id == telegram_id)
        rows = list((await session.scalars(query)).all())
        if not rows:
            raise SystemExit(f"Пользователи не найдены для --name-{side[-1]}={name!r}")
        return rows

    group_a = await by_side(args.id_a, args.name_a, args.telegram_id_a, "a")
    group_b = await by_side(args.id_b, args.name_b, args.telegram_id_b, "b")
    return group_a, group_b


def print_users(label: str, users: list[User]) -> None:
    print(f"\n{label}:")
    for u in users:
        print(f"  - {u.name}  id={u.id}  telegram_id={u.telegram_id}")


def _cross_group_filter(ids_a: list[UUID], ids_b: list[UUID], col_a, col_b):
    return or_(
        and_(col_a.in_(ids_a), col_b.in_(ids_b)),
        and_(col_a.in_(ids_b), col_b.in_(ids_a)),
    )


def _user_involved_filter(user_ids: list[UUID], col_a, col_b):
    return or_(col_a.in_(user_ids), col_b.in_(user_ids))


async def count_for_users(session: AsyncSession, user_ids: list[UUID]) -> dict[str, int]:
    like_count = len(
        (
            await session.execute(
                select(Like.user_from_id).where(
                    or_(Like.user_from_id.in_(user_ids), Like.user_to_id.in_(user_ids))
                )
            )
        ).all()
    )
    match_count = len(
        (
            await session.execute(
                select(Match.id).where(
                    or_(Match.user1_id.in_(user_ids), Match.user2_id.in_(user_ids))
                )
            )
        ).all()
    )
    return {"likes": like_count, "matches": match_count}


async def list_likes_for_users(
    session: AsyncSession, user_ids: list[UUID], limit: int = 20
) -> list[tuple[str, str, str]]:
    result = await session.execute(
        select(Like.user_from_id, Like.user_to_id, Like.like_type)
        .where(or_(Like.user_from_id.in_(user_ids), Like.user_to_id.in_(user_ids)))
        .limit(limit)
    )
    id_to_name: dict[UUID, str] = {}
    for uid in user_ids:
        user = await session.get(User, uid)
        if user:
            id_to_name[uid] = user.name
    rows = []
    for from_id, to_id, like_type in result.all():
        rows.append(
            (
                id_to_name.get(from_id, str(from_id)[:8]),
                id_to_name.get(to_id, str(to_id)[:8]),
                like_type.value if hasattr(like_type, "value") else str(like_type),
            )
        )
    return rows


async def list_likes(session: AsyncSession, ids_a: list[UUID], ids_b: list[UUID]) -> list[tuple[str, str, str]]:
    result = await session.execute(
        select(Like.user_from_id, Like.user_to_id, Like.like_type).where(
            _cross_group_filter(ids_a, ids_b, Like.user_from_id, Like.user_to_id)
        )
    )
    rows = []
    id_to_name: dict[UUID, str] = {}
    for uid in ids_a + ids_b:
        user = await session.get(User, uid)
        if user:
            id_to_name[uid] = user.name
    for from_id, to_id, like_type in result.all():
        rows.append(
            (
                id_to_name.get(from_id, str(from_id)),
                id_to_name.get(to_id, str(to_id)),
                like_type.value if hasattr(like_type, "value") else str(like_type),
            )
        )
    return rows


async def delete_db_interactions(
    session: AsyncSession,
    ids_a: list[UUID],
    ids_b: list[UUID],
    *,
    wipe_all: bool = False,
) -> dict[str, int]:
    stats = {"likes": 0, "messages": 0, "matches": 0}
    all_ids = ids_a + ids_b

    if wipe_all:
        like_filter = or_(Like.user_from_id.in_(all_ids), Like.user_to_id.in_(all_ids))
        match_filter = or_(Match.user1_id.in_(all_ids), Match.user2_id.in_(all_ids))
    else:
        like_filter = _cross_group_filter(ids_a, ids_b, Like.user_from_id, Like.user_to_id)
        match_filter = _cross_group_filter(ids_a, ids_b, Match.user1_id, Match.user2_id)

    like_result = await session.execute(delete(Like).where(like_filter))
    stats["likes"] = like_result.rowcount or 0

    match_ids_subq = select(Match.id).where(match_filter)
    chat_ids_subq = select(Chat.id).where(Chat.match_id.in_(match_ids_subq))

    message_ids_subq = select(Message.id).where(Message.chat_id.in_(chat_ids_subq))
    await session.execute(delete(MessagePhoto).where(MessagePhoto.message_id.in_(message_ids_subq)))
    msg_result = await session.execute(delete(Message).where(Message.chat_id.in_(chat_ids_subq)))
    stats["messages"] = msg_result.rowcount or 0

    if wipe_all:
        await session.execute(delete(Message).where(Message.sender_id.in_(all_ids)))

    match_result = await session.execute(delete(Match).where(match_filter))
    stats["matches"] = match_result.rowcount or 0

    await session.commit()
    return stats


async def clear_redis(
    ids_a: list[UUID],
    ids_b: list[UUID],
    *,
    wipe_all: bool = False,
) -> dict[str, int]:
    from redis.asyncio import Redis

    redis = Redis(host=REDIS_CONFIG.REDIS_HOST, port=REDIS_CONFIG.REDIS_PORT, decode_responses=True)
    stats = {"seen_removed": 0, "dislikes_removed": 0, "notify_keys_removed": 0}

    str_a = [str(i) for i in ids_a]
    str_b = [str(i) for i in ids_b]
    all_str = str_a + str_b

    if wipe_all:
        for uid in all_str:
            stats["seen_removed"] += await redis.delete(UserCacheKeys.SEEN_USERS.format(user_id=uid))
            pattern = f"notify:like:{uid}:*"
            keys = [k async for k in redis.scan_iter(match=pattern)]
            if keys:
                stats["notify_keys_removed"] += await redis.delete(*keys)
        for key in (LikeCacheKeys.DISLIKE_BUFFER, LikeCacheKeys.DISLIKE_BUFFER_PROCESSING):
            members = await redis.smembers(key)
            to_remove = [m for m in members if any(u in m for u in all_str)]
            if to_remove:
                stats["dislikes_removed"] += await redis.srem(key, *to_remove)
        await redis.aclose()
        return stats

    for uid_a in str_a:
        for uid_b in str_b:
            stats["seen_removed"] += await redis.srem(
                UserCacheKeys.SEEN_USERS.format(user_id=uid_a), uid_b
            )
            stats["seen_removed"] += await redis.srem(
                UserCacheKeys.SEEN_USERS.format(user_id=uid_b), uid_a
            )

            for key in (LikeCacheKeys.DISLIKE_BUFFER, LikeCacheKeys.DISLIKE_BUFFER_PROCESSING):
                stats["dislikes_removed"] += await redis.srem(key, f"{uid_a}:{uid_b}", f"{uid_b}:{uid_a}")

            for recipient_id in (uid_a, uid_b):
                pattern = f"notify:like:{recipient_id}:*"
                keys = [k async for k in redis.scan_iter(match=pattern)]
                if keys:
                    stats["notify_keys_removed"] += await redis.delete(*keys)

            pair_key = ":".join(sorted((uid_a, uid_b)))
            for recipient_id in (uid_a, uid_b):
                stats["notify_keys_removed"] += await redis.delete(
                    LikeCacheKeys.NOTIFY_MATCH_SENT.format(recipient_id=recipient_id, pair_key=pair_key)
                )

    await redis.aclose()
    return stats


async def main() -> None:
    args = parse_args()
    engine = create_async_engine(DB_CONFIG.get_url(is_async=True))

    async with AsyncSession(engine) as session:
        group_a, group_b = await resolve_users(session, args)
        print_users("Группа A", group_a)
        print_users("Группа B", group_b)

        ids_a = [u.id for u in group_a]
        ids_b = [u.id for u in group_b]
        all_ids = ids_a + ids_b

        if args.wipe_all:
            counts = await count_for_users(session, all_ids)
            print(f"\n[wipe-all] Всего у указанных пользователей:")
            print(f"  лайков: {counts['likes']}, метчей: {counts['matches']}")
            sample = await list_likes_for_users(session, all_ids, limit=10)
            if sample:
                print("  примеры лайков (до 10):")
                for fn, tn, lt in sample:
                    print(f"    - {fn} -> {tn} ({lt})")
        else:
            existing = await list_likes(session, ids_a, ids_b)
            print(f"\nЛайков/дизлайков между группами: {len(existing)}")
            for fn, tn, lt in existing:
                print(f"  - {fn} -> {tn} ({lt})")

        if args.dry_run:
            print("\n[dry-run] Ничего не удалено.")
            return

        db_stats = await delete_db_interactions(session, ids_a, ids_b, wipe_all=args.wipe_all)
        redis_stats = await clear_redis(ids_a, ids_b, wipe_all=args.wipe_all)

    print("\nГотово:")
    print(f"  DB  — лайки: {db_stats['likes']}, сообщения: {db_stats['messages']}, метчи: {db_stats['matches']}")
    print(
        f"  Redis — seen: {redis_stats['seen_removed']}, "
        f"dislikes: {redis_stats['dislikes_removed']}, notify: {redis_stats['notify_keys_removed']}"
    )
    print("\nМетч = только когда второй уже лайкнул первого.")
    print("После сброса: первый лайк → 204 (без метча), ответный лайк → метч.")


if __name__ == "__main__":
    asyncio.run(main())
