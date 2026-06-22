from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.loaders.test_db import seed_admin_from_env_if_missing, seed_filters_if_missing


async def bootstrap_production(session: AsyncSession) -> None:
    await seed_filters_if_missing(session)
    created_admin = await seed_admin_from_env_if_missing(session)
    has_admin = created_admin or await _has_admin(session)
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
