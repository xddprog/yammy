from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import AdminRoleEnum


class Admin(Base):
    __tablename__ = "admins"

    username: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]
    role: Mapped[AdminRoleEnum] = mapped_column(
        SQLAlchemyEnum(AdminRoleEnum),
        default=AdminRoleEnum.SUPPORT,
        server_default=AdminRoleEnum.SUPPORT.value,
    )
