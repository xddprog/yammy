import os

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.config.config import APP_CONFIG


def _is_development_env() -> bool:
    return (
        APP_CONFIG.ENVIRONMENT == "development"
        or os.getenv("YAMMY_ENV", "").strip().lower() == "development"
    )


async def bootstrap_admins(session: AsyncSession) -> bool:
    from app.utils.loaders.test_db import seed_admin_from_env_if_missing, seed_dev_admins_if_missing

    created_from_env = await seed_admin_from_env_if_missing(session)
    if created_from_env:
        return True

    if not await _has_admin(session) and _is_development_env():
        return await seed_dev_admins_if_missing(session)

    return False


async def bootstrap_production(session: AsyncSession) -> None:
    from app.utils.loaders.test_db import seed_filters_if_missing

    await seed_filters_if_missing(session)
    await bootstrap_admins(session)
    has_admin = await _has_admin(session)
    await session.commit()
    if not has_admin:
        from app.infrastructure.logging.logger import get_logger

        get_logger(__name__).warning(
            "production_admin_missing",
            hint="Set APP_CONFIG__ADMIN_BOOTSTRAP_USERNAME and APP_CONFIG__ADMIN_BOOTSTRAP_PASSWORD",
        )


async def _has_admin(session: AsyncSession) -> bool:
    from sqlalchemy import select

    from app.infrastructure.database.models.admin import Admin

    return (await session.execute(select(Admin))).scalars().first() is not None
