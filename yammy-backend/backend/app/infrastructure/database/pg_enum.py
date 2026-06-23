from enum import Enum

from sqlalchemy import Enum as SQLAlchemyEnum


def pg_enum(enum_cls: type[Enum], **kwargs) -> SQLAlchemyEnum:
    return SQLAlchemyEnum(
        enum_cls,
        values_callable=lambda obj: [member.value for member in obj],
        **kwargs,
    )
