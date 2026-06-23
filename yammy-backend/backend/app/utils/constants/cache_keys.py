from enum import IntEnum


class CacheTTL(IntEnum):
    MINUTE = 60
    HOUR = 3600


class FilterCacheKeys:
    ALL = "filters:all"


class UserCacheKeys:
    PROFILE = "user:{user_id}:profile"
    USER_VECTOR = "user:{user_id}:vector"
    SEEN_USERS = "user:{user_id}:seen_users"


class LikeCacheKeys:
    DISLIKE_BUFFER = "like:dislike_buffer"
    DISLIKE_BUFFER_PROCESSING = "like:dislike_buffer:processing"

    NOTIFY_LIKE_SENT = "notify:like:{user_to_id}:{liker_name}:{like_type}"
    NOTIFY_MATCH_SENT = "notify:match:{recipient_id}:{pair_key}"


class MessageCacheKeys:
    NOTIFY_CHAT_MESSAGE_SENT = "notify:chat_message:{message_id}"


class AppearanceRatingCacheKeys:
    APPEARANCE_RATED_USERS = "user:{user_id}:appearance_rated_users"
    NOTIFY_APPEARANCE_RATING_SENT = "notify:appearance_rating:{rated_user_id}:{rater_id}:{score}"
    NOTIFY_MUTUAL_RATING_SENT = "notify:mutual_rating:{pair_id}"


class CityCacheKeys:
    NAMES = "cities:names"


class UniversityCacheKeys:
    NAMES = "universities:names"


class PresenceKeys:
    ONLINE_SET = "presence:online"
    LAST_SEEN_BUFFER = "presence:last_seen:buffer"
    LAST_SEEN_BUFFER_PROCESSING = "presence:last_seen:buffer:processing"

    @staticmethod
    def session_key(session_id: str) -> str:
        return f"presence:session:{session_id}"

    @staticmethod
    def user_sessions_key(user_id: str) -> str:
        return f"presence:user:{user_id}:sessions"