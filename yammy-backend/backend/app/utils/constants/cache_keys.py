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


class AppearanceRatingCacheKeys:
    APPEARANCE_RATING_BUFFER = "appearance_rating:buffer"
    APPEARANCE_RATED_USERS = "user:{user_id}:appearance_rated_users"


class CityCacheKeys:
    NAMES = "cities:names"


class UniversityCacheKeys:
    NAMES = "universities:names"