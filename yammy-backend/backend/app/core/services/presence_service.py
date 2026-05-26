import asyncio
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from app.core.clients.redis_client import RedisClient
from app.core.dto.presence import (
    PresenceErrorResponseSchema,
    PresencePeerSchema,
    PresenceSnapshotSchema,
    PresenceUpdateSchema,
)
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.logging import get_logger
from app.utils.constants.cache_keys import PresenceKeys
from app.utils.constants.enums import PresenceEvents

logger = get_logger(__name__)


class PresenceService:
    HEARTBEAT_TTL_SECONDS = 45
    HEARTBEAT_GRACE_SECONDS = 5

    def __init__(
        self,
        redis_client: RedisClient,
        db_connection: DatabaseConnection,
    ) -> None:
        self._redis = redis_client
        self._db_connection = db_connection
        self._connections: dict[str, WebSocket] = {}
        self._session_users: dict[str, UUID] = {}
        self._subscriptions: dict[str, set[UUID]] = {}
        self._timeout_tasks: dict[str, asyncio.Task[None]] = {}

    def _cancel_timeout_task(self, session_id: str) -> None:
        task = self._timeout_tasks.pop(session_id, None)
        current_task = asyncio.current_task()
        if task and task is not current_task and not task.done():
            task.cancel()

    def _arm_timeout_task(self, session_id: str) -> None:
        self._cancel_timeout_task(session_id)
        self._timeout_tasks[session_id] = asyncio.create_task(
            self._timeout_session(session_id)
        )

    async def _timeout_session(self, session_id: str) -> None:
        try:
            await asyncio.sleep(
                self.HEARTBEAT_TTL_SECONDS + self.HEARTBEAT_GRACE_SECONDS
            )
            await self.unregister(session_id)
        except asyncio.CancelledError:
            return

    async def _prune_user_sessions(self, user_id: UUID) -> int:
        user_sessions_key = PresenceKeys.user_sessions_key(str(user_id))
        session_ids = await self._redis.smembers(user_sessions_key)
        if not session_ids:
            return 0

        stale_session_ids: list[str] = []
        active_count = 0

        for session_id in session_ids:
            if await self._redis.exists(PresenceKeys.session_key(session_id)):
                active_count += 1
            else:
                stale_session_ids.append(session_id)

        if stale_session_ids:
            await self._redis.srem(user_sessions_key, *stale_session_ids)

        return active_count

    async def _set_online_state(self, user_id: UUID) -> bool:
        active_count = await self._prune_user_sessions(user_id)
        if active_count <= 0:
            await self._redis.srem(PresenceKeys.ONLINE_SET, str(user_id))
            return False

        was_online = await self._redis.sismember(PresenceKeys.ONLINE_SET, str(user_id))
        if not was_online:
            await self._redis.sadd(PresenceKeys.ONLINE_SET, str(user_id))
        return not was_online

    async def _persist_last_seen(self, user_id: UUID, at: datetime) -> None:
        async with await self._db_connection.get_session() as session:
            repository = UserRepository(session=session)
            await repository.update_last_seen(user_id, at)

    async def _send_envelope(
        self,
        websocket: WebSocket,
        event: PresenceEvents,
        data: PresenceSnapshotSchema | PresenceUpdateSchema | PresenceErrorResponseSchema,
    ) -> None:
        await websocket.send_json(
            {
                "event": event,
                "data": data.model_dump(mode="json"),
            }
        )

    async def send_error(
        self,
        websocket: WebSocket,
        status_code: int,
        detail: str,
    ) -> None:
        if websocket.application_state == WebSocketState.DISCONNECTED:
            return

        try:
            await self._send_envelope(
                websocket,
                PresenceEvents.ERROR,
                PresenceErrorResponseSchema(status_code=status_code, detail=detail),
            )
        except Exception:
            logger.warning("presence_error_send_failed", status_code=status_code)

    async def is_user_online(self, user_id: UUID) -> bool:
        active_count = await self._prune_user_sessions(user_id)
        if active_count <= 0:
            await self._redis.srem(PresenceKeys.ONLINE_SET, str(user_id))
            return False

        await self._redis.sadd(PresenceKeys.ONLINE_SET, str(user_id))
        return True

    async def _send_snapshot(self, session_id: str) -> None:
        websocket = self._connections.get(session_id)
        if websocket is None:
            return

        peer_ids = self._subscriptions.get(session_id, set())
        peers: list[PresencePeerSchema] = []

        for peer_id in sorted(peer_ids, key=str):
            peers.append(
                PresencePeerSchema(
                    user_id=peer_id,
                    online=await self.is_user_online(peer_id),
                )
            )

        await self._send_envelope(
            websocket,
            PresenceEvents.PRESENCE_SNAPSHOT,
            PresenceSnapshotSchema(peers=peers),
        )

    async def _broadcast_presence_update(
        self,
        subject_id: UUID,
        online: bool,
        at: datetime,
    ) -> None:
        # Single-instance fanout stays local; Redis Pub/Sub can be inserted here later.
        payload = PresenceUpdateSchema(
            user_id=subject_id,
            online=online,
            at=at,
        )
        stale_session_ids: list[str] = []

        for session_id, peer_ids in list(self._subscriptions.items()):
            if subject_id not in peer_ids:
                continue

            websocket = self._connections.get(session_id)
            if websocket is None:
                continue

            try:
                await self._send_envelope(
                    websocket,
                    PresenceEvents.PRESENCE_UPDATE,
                    payload,
                )
            except Exception:
                stale_session_ids.append(session_id)

        for session_id in stale_session_ids:
            await self.unregister(session_id, close_socket=False)

    async def register(self, user_id: UUID, websocket: WebSocket) -> str:
        session_id = str(uuid4())
        self._connections[session_id] = websocket
        self._session_users[session_id] = user_id
        self._subscriptions[session_id] = set()

        await self._redis.set(
            PresenceKeys.session_key(session_id),
            str(user_id),
            ttl=self.HEARTBEAT_TTL_SECONDS,
        )
        await self._redis.sadd(
            PresenceKeys.user_sessions_key(str(user_id)),
            session_id,
        )

        became_online = await self._set_online_state(user_id)
        self._arm_timeout_task(session_id)

        if became_online:
            await self._broadcast_presence_update(
                subject_id=user_id,
                online=True,
                at=datetime.now(timezone.utc),
            )

        return session_id

    async def heartbeat(self, session_id: str) -> None:
        user_id = self._session_users.get(session_id)
        if user_id is None:
            return

        await self._redis.set(
            PresenceKeys.session_key(session_id),
            str(user_id),
            ttl=self.HEARTBEAT_TTL_SECONDS,
        )
        await self._redis.sadd(
            PresenceKeys.user_sessions_key(str(user_id)),
            session_id,
        )

        self._arm_timeout_task(session_id)
        became_online = await self._set_online_state(user_id)
        if became_online:
            await self._broadcast_presence_update(
                subject_id=user_id,
                online=True,
                at=datetime.now(timezone.utc),
            )

    async def subscribe(self, session_id: str, peer_ids: set[UUID]) -> None:
        if session_id not in self._connections:
            return

        self._subscriptions[session_id] = set(peer_ids)
        await self._send_snapshot(session_id)

    async def unregister(self, session_id: str, close_socket: bool = True) -> None:
        websocket = self._connections.pop(session_id, None)
        user_id = self._session_users.pop(session_id, None)
        self._subscriptions.pop(session_id, None)
        self._cancel_timeout_task(session_id)

        if close_socket and websocket is not None:
            try:
                if websocket.application_state != WebSocketState.DISCONNECTED:
                    await websocket.close()
            except Exception:
                logger.warning("presence_socket_close_failed", session_id=session_id)

        if user_id is None:
            return

        await self._redis.delete_by_key(PresenceKeys.session_key(session_id))
        await self._redis.srem(
            PresenceKeys.user_sessions_key(str(user_id)),
            session_id,
        )

        active_count = await self._prune_user_sessions(user_id)
        if active_count > 0:
            return

        now = datetime.now(timezone.utc)
        await self._redis.srem(PresenceKeys.ONLINE_SET, str(user_id))
        await self._persist_last_seen(user_id, now)
        await self._broadcast_presence_update(
            subject_id=user_id,
            online=False,
            at=now,
        )
