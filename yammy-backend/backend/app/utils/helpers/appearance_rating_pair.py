from uuid import UUID


def canonical_pair(user_x: UUID, user_y: UUID) -> tuple[UUID, UUID, bool]:
    if user_x < user_y:
        return user_x, user_y, True
    return user_y, user_x, False
