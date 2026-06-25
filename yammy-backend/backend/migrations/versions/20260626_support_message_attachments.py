"""Support message attachments stored as Telegram file_id references."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260626_support_message_attachments"
down_revision = "20260625_support_tickets"
branch_labels = None
depends_on = None

ATTACHMENT_TYPE = sa.Enum("photo", "document", name="supportattachmenttypeenum", create_type=False)


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": name},
        ).scalar()
        is not None
    )


def _column_exists(conn, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()
    if not _enum_exists(conn, "supportattachmenttypeenum"):
        ATTACHMENT_TYPE.create(conn, checkfirst=True)

    if not _column_exists(conn, "support_messages", "attachment_type"):
        op.add_column("support_messages", sa.Column("attachment_type", ATTACHMENT_TYPE, nullable=True))
    if not _column_exists(conn, "support_messages", "telegram_file_id"):
        op.add_column("support_messages", sa.Column("telegram_file_id", sa.String(256), nullable=True))
    if not _column_exists(conn, "support_messages", "telegram_file_unique_id"):
        op.add_column(
            "support_messages",
            sa.Column("telegram_file_unique_id", sa.String(256), nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "support_messages", "telegram_file_unique_id"):
        op.drop_column("support_messages", "telegram_file_unique_id")
    if _column_exists(conn, "support_messages", "telegram_file_id"):
        op.drop_column("support_messages", "telegram_file_id")
    if _column_exists(conn, "support_messages", "attachment_type"):
        op.drop_column("support_messages", "attachment_type")
    if _enum_exists(conn, "supportattachmenttypeenum"):
        ATTACHMENT_TYPE.drop(conn, checkfirst=True)
